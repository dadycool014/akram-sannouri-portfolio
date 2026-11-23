// Serveur du site Call 19 Production.
// Il sert le site (dossier public) et envoie par email les demandes du formulaire de devis.
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import nodemailer from "nodemailer";

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.join(here, ".env"));
} catch {
  // Pas de fichier .env : les variables viennent de l'hébergeur.
}

const env = process.env;
const PORT = Number(env.PORT) || 3019;
const IN_PRODUCTION = env.NODE_ENV === "production";
const MAIL_TO = env.MAIL_TO || "call19production@gmail.com";
const SERVICES = ["Stratégie digitale", "Production audiovisuelle", "Marketing digital", "A.I", "Autre"];
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);

// Envoi par SMTP quand il est configuré. Sinon, en local, la demande s'affiche dans la console.
const smtpPort = Number(env.SMTP_PORT) || 465;
const smtpReady = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const transport = smtpReady
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: smtpPort,
      secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : smtpPort === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : nodemailer.createTransport({ jsonTransport: true });
const MAIL_FROM = env.MAIL_FROM || { name: "Site Call 19 Production", address: env.SMTP_USER || MAIL_TO };

// Au plus 5 demandes par adresse IP toutes les 15 minutes.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const recent = new Map();
function overLimit(ip) {
  const now = Date.now();
  const entry = recent.get(ip);
  if (!entry || entry.resetAt <= now) {
    recent.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of recent) if (entry.resetAt <= now) recent.delete(ip);
}, WINDOW_MS).unref();

// Champs reçus : texte brut, longueur bornée.
const text = (value, max) => String(value ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const line = (value, max) => text(value, max).replace(/\s+/g, " ");
const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const receivedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Casablanca" });

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // derrière le proxy de l'hébergeur, l'IP du visiteur arrive dans X-Forwarded-For

app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
  });
  next();
});

// Site servi par un autre hébergement : seules les origines de ALLOWED_ORIGINS peuvent appeler l'API.
app.use("/api", (req, res, next) => {
  const origin = req.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.post("/api/contact", express.json({ limit: "16kb" }), async (req, res) => {
  const body = req.body ?? {};
  // Champ piège invisible : seul un robot le remplit. On répond « ok » sans rien envoyer.
  if (text(body.website, 200)) return res.json({ ok: true });
  if (overLimit(req.ip)) return res.status(429).json({ ok: false, error: "rate_limited" });

  const name = line(body.name, 120);
  const email = line(body.email, 254);
  const service = line(body.service, 60);
  const date = line(body.date, 10);
  const message = text(body.message, 5000);

  if (!EMAIL.test(email)) return res.status(400).json({ ok: false, error: "invalid_email" });
  if (!SERVICES.includes(service)) return res.status(400).json({ ok: false, error: "invalid_service" });
  if (date && !DATE.test(date)) return res.status(400).json({ ok: false, error: "invalid_date" });
  if (!smtpReady && IN_PRODUCTION) return res.status(503).json({ ok: false, error: "mail_not_configured" });

  const subject = `Demande de devis : ${service}${name ? ` · ${name}` : ""}`;
  const content = [
    "Nouvelle demande de devis envoyée depuis le site.",
    "",
    `Nom : ${name || "(non indiqué)"}`,
    `Email : ${email}`,
    `Service souhaité : ${service}`,
    `Date souhaitée : ${date ? date.split("-").reverse().join("/") : "(non indiquée)"}`,
    "",
    "Projet :",
    message || "(pas de description)",
    "",
    `Reçue le ${receivedAt.format(new Date())}, heure du Maroc.`,
    "Pour répondre au client, répondez simplement à cet email.",
  ].join("\n");

  try {
    await transport.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: name ? { name, address: email } : email,
      subject,
      text: content,
    });
    if (!smtpReady) {
      console.log(`\n[mode test] Email NON envoyé (SMTP non configuré)\nÀ : ${MAIL_TO}\nObjet : ${subject}\nRépondre à : ${email}\n\n${content}\n`);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Échec de l'envoi de la demande :", err.message);
    res.status(502).json({ ok: false, error: "send_failed" });
  }
});

app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "not_found" }));

app.use(
  express.static(path.join(here, "public"), {
    setHeaders(res, file) {
      res.set("Cache-Control", file.endsWith(".html") ? "no-cache" : "public, max-age=604800");
    },
  }),
);

// JSON illisible ou trop long envoyé à l'API : réponse en JSON plutôt qu'une page d'erreur.
app.use((err, req, res, next) => {
  if (!req.path.startsWith("/api/")) return next(err);
  res.status(err.status || 400).json({ ok: false, error: "bad_request" });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(`Impossible de démarrer sur le port ${PORT} :`, err.message);
    process.exit(1);
  }
  console.log(`Site Call 19 Production : http://localhost:${PORT}`);
  if (smtpReady) {
    transport
      .verify()
      .then(() => console.log(`SMTP prêt : les demandes de devis partent vers ${MAIL_TO}.`))
      .catch((e) => console.error(`SMTP refusé (${env.SMTP_HOST}) :`, e.message));
  } else if (IN_PRODUCTION) {
    console.error("SMTP non configuré : le formulaire répond par une erreur. Renseignez SMTP_HOST, SMTP_USER et SMTP_PASS.");
  } else {
    console.warn("SMTP non configuré : mode test, les demandes s'affichent ici au lieu d'être envoyées.");
  }
});
