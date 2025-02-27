import "dotenv/config";
import Moralis from "moralis";

// ✅ Inisialisasi Moralis
(async () => {
  try {
    await Moralis.start({ apiKey: process.env.NEXT_PUBLIC_MORALIS });
    console.log("✅ Moralis initialized successfully.");
  } catch (error) {
    console.error("❌ Moralis initialization failed:", error);
  }
})();

// 🔍 Fungsi untuk mengambil symbol dari token
export async function fetchTokenSymbol(address) { // ⬅️ Jangan pakai `export default`
  try {
    console.log(`🔍 Fetching symbol for: ${address}`);
    const response = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: address,
    });
    return response.raw.symbol; // Ambil hanya symbol-nya
  } catch (error) {
    console.error("❌ Error fetching token symbol:", error);
    return undefined;
  }
}
