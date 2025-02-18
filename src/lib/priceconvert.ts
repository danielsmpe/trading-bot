export function formatDecimal(number: number): string {
  if (number === 0 || Math.abs(number) >= 1) return number.toString();

  const isNegative = number < 0;
  const absNum = Math.abs(number);
  const numStr = absNum.toString();
  const match = numStr.match(/^0\.(0+)(\d+)/);

  if (!match) return number.toString();

  const zeroCount = match[1].length;
  let significantPart = match[2];

  const maxSignificantLength = 10 - (zeroCount.toString().length + 5);
  significantPart = significantPart.slice(0, maxSignificantLength);

  let formatted = `0.0{${zeroCount}}${significantPart}`;
  return isNegative ? `-${formatted}` : formatted;
}

export function convertSolToUsd(solPrice: number, amount: number): string {
    if (solPrice <= 0) return "Invalid solPrice";
    const usdAmount = solPrice * amount;
    return usdAmount.toFixed(2);
}

export function convertUsdToSol(solPrice: number, usdAmount: number): string {
  if (solPrice <= 0) return "Invalid solPrice";
  const solAmount = usdAmount / solPrice;
  return solAmount.toFixed(6);
}