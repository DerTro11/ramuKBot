export const latinToCyrillicMap: Record<string, string> = {
    "a": "а", "b": "б", "c": "ц", "d": "д", "e": "е", "f": "ф", "g": "г", "h": "х",
    "i": "и", "j": "й", "k": "к", "l": "л", "m": "м", "n": "н", "o": "о", "p": "п", // Latin letters mapped to Crylic letters
    "q": "қ", "r": "р", "s": "с", "t": "т", "u": "у", "v": "в", "w": "щ", "x": "х", //                      I know I misspelled that but idc
    "y": "ы", "z": "з"
};
  
export function convertLatinToCyrillic(input: string): string {
    return input.split('').map(char => {
      const lowerChar = char.toLowerCase();
      const convertedChar = latinToCyrillicMap[lowerChar] || char;
      return char === lowerChar ? convertedChar : convertedChar.toUpperCase();
    }).join('');
}
