
export const getMintAddresses = (): string[] => {
    return JSON.parse(localStorage.getItem('mintAddresses') || '[]');
  };
  
  export const setMintAddresses = (addresses: string[]): void => {
    localStorage.setItem('mintAddresses', JSON.stringify(addresses));
  };
  
  export const removeMintAddress = (addressToRemove: string): void => {
    const addresses = getMintAddresses();
    const updatedAddresses = addresses.filter((address) => address !== addressToRemove);
    setMintAddresses(updatedAddresses);
  };
  