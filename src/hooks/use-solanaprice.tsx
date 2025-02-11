import { useEffect, useState } from "react";
import axios from "axios";

const LOCAL_STORAGE_KEY = "solana_price";

const useSolanaPrice = () => {
  const [solPrice, setSolPrice] = useState<number | null>(() => {
    const storedPrice = localStorage.getItem(LOCAL_STORAGE_KEY);
    return storedPrice ? parseFloat(storedPrice) : null;
  });

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // const response = await axios.get(
        //   "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        // );
        // console.log(response);
        // const price = response.data.solana?.usd ?? null;
        // console.log(price);
        // if (price !== null) {
        //   setSolPrice(price);
        //   localStorage.setItem(LOCAL_STORAGE_KEY, price.toString());
        // }
      } catch (error) {
        console.error("Error fetching SOL price:", error);
      }
    };

    // Fetch harga hanya jika localStorage kosong
    if (solPrice === null) {
      fetchPrice();
    }
  }, []);

  return solPrice;
};

export default useSolanaPrice;
