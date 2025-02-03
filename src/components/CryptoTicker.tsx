import { useEffect, useRef, useState } from "react"
import { TrendingUp, DollarSign } from "lucide-react"

interface CryptoData {
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: string
}

const solanaMemeCoins: CryptoData[] = [
  {
    name: "Bonk",
    symbol: "BONK",
    price: 0.000023,
    change24h: -6.55,
    marketCap: "$1.83B",
  },
  {
    name: "dogwifhat",
    symbol: "WIF",
    price: 1.1,
    change24h: -10.9,
    marketCap: "$1.09B",
  },
  {
    name: "SLERF",
    symbol: "SLERF",
    price: 0.000000001,
    change24h: 15.2,
    marketCap: "$10.5M",
  },
  {
    name: "Silly Dragon",
    symbol: "SILLY",
    price: 0.0000035,
    change24h: -8.7,
    marketCap: "$3.5M",
  },
  {
    name: "Cope",
    symbol: "COPE",
    price: 0.0275,
    change24h: 3.2,
    marketCap: "$4.4M",
  },
  {
    name: "Solana Monkey Business",
    symbol: "SMB",
    price: 71.5,
    change24h: -2.1,
    marketCap: "$71.5M",
  },
]

export function CryptoTicker() {
  const [tickerWidth, setTickerWidth] = useState(0)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tickerRef.current) {
      setTickerWidth(tickerRef.current.scrollWidth)
    }
  }, [])

  const renderTokenInfo = (token: CryptoData, index: number) => {
    return (
      <div key={`${token.symbol}-${index}`} className="flex items-center mr-8">
        <div className="flex items-center">
          <TrendingUp className="w-4 h-4 text-[#60d6a2] mr-2" />
          <span className="text-white font-bold">{token.symbol}</span>
          <span className="text-gray-400 ml-2 text-sm hidden sm:inline">({token.name})</span>
        </div>
        <div className="flex items-center ml-3">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-gray-200">{token.price < 0.01 ? token.price.toFixed(9) : token.price.toFixed(2)}</span>
        </div>
        <span className={`ml-2 ${token.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
          ({token.change24h >= 0 ? "+" : ""}
          {token.change24h.toFixed(2)}%)
        </span>
        <span className="text-gray-400 ml-2 hidden md:inline">MCap: {token.marketCap}</span>
      </div>
    )
  }

  return (
    <div className="bg-black border-t border-b border-gray-800 overflow-hidden py-2">
      <div
        ref={tickerRef}
        className="ticker-content inline-flex whitespace-nowrap"
        style={{
          animation: `ticker ${tickerWidth * 0.02}s linear infinite`,
        }}
      >
        {solanaMemeCoins.concat(solanaMemeCoins).map((token, index) => renderTokenInfo(token, index))}
      </div>
    </div>
  )
}

