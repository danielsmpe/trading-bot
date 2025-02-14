require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const readline = require("readline");

const apiId = parseInt(process.env.TELEGRAM_API_ID || "", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";
const sessionString = process.env.TELEGRAM_SESSION || "";
const stringSession = new StringSession(sessionString);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Fungsi untuk meminta input dari terminal
function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

(async () => {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => process.env.TELEGRAM_PHONE_NUMBER || "",
    phoneCode: async () => {
      const code = await askQuestion("Masukkan kode OTP yang dikirim ke Telegram: ");
      return code;
    },
    password: async () => {
      const password = await askQuestion("Masukkan password 2FA Telegram: ");
      return password;
    },
    onError: (err) => console.error("Login error:", err),
  });

  rl.close(); // Tutup input setelah login berhasil
  console.log("✅ Login sukses! Simpan session ini:");
  console.log(client.session.save());
})();
