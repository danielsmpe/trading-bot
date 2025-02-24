export function formatDecimal(number: number): string {
  if (number === undefined || number === null || isNaN(number)) {
    return "0";
  }

  if (number === 0 || Math.abs(number) >= 1) return number.toString();

  const isNegative = number < 0;
  const absNum = Math.abs(number);
  const numStr = absNum.toFixed(20); // Hindari notasi ilmiah dengan banyak desimal
  const match = numStr.match(/^0\.(0+)(\d+)/);

  if (!match) return number.toString();

  const zeroCount = match[1].length;
  let significantPart = match[2];

  const maxSignificantLength = 5; // Tampilkan 5 digit signifikan setelah nol
  significantPart = significantPart.slice(0, maxSignificantLength);

  // Gunakan notasi kurung jika nol berturut-turut banyak
  let formatted = zeroCount > 3
    ? `0.{0(${zeroCount})}${significantPart}`
    : `0.${"0".repeat(zeroCount)}${significantPart}`;

  return isNegative ? `-${formatted}` : formatted;
}


export function convertSolToUsd(solPrice: number, amount: number): string {
  if (isNaN(solPrice) || solPrice <= 0) return "0.00";
  if (isNaN(amount) || amount <= 0) return "0.00";

  const usdAmount = solPrice * amount;
  return usdAmount.toFixed(5);
}


export function convertUsdToSol(solPrice: number, usdAmount: number): number {
  if (solPrice <= 0) throw new Error("Invalid solPrice"); // Lebih baik lempar error
  const solAmount = usdAmount / solPrice;
  return parseFloat(solAmount.toFixed(6)); // Mengembalikan number, bukan string
}
