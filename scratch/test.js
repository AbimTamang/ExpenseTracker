const lines = [
  "Account Interest Rate:",
  "2.75%",
  "Accrued Interest :",
  "0.06"
];

let pendingDescription = "";

for (let line of lines) {
  if (!line.trim()) continue;
  
  const dateMatch = line.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
  if (/balance|opening|closing|total|summary|interest|tax/i.test(line)) {
    pendingDescription = "";
    continue;
  }

  let lineWithoutDate = line;
  if (dateMatch) {
     lineWithoutDate = line.replace(dateMatch[0], "");
  }
  
  const amountMatch = lineWithoutDate.match(/(?:(?:Rs\.?|NPR|\$)\s*)(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i) 
                      || lineWithoutDate.match(/\b(\d+(?:,\d{3})*\.\d{2})\b(?!\s*%)/)
                      || lineWithoutDate.match(/^\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/);
  
  if (amountMatch) {
    const matchedStr = amountMatch[1];
    if (!matchedStr) continue;

    const amount = parseFloat(matchedStr.replace(/,/g, ""));
    
    if (amount > 0 && amount < 10000000) {
      let description = lineWithoutDate.replace(amountMatch[0], "").replace(/[^a-zA-Z\s]/g, " ").replace(/\s\s+/g, ' ').trim();
      
      if (description.length < 3 && pendingDescription.length >= 3) {
        description = pendingDescription;
      }
      
      if (description.length >= 3) {
        console.log(`Found: ${description} | Amount: ${amount}`);
        pendingDescription = "";
      }
    }
  } else {
    const textOnly = lineWithoutDate.replace(/[^a-zA-Z\s]/g, " ").replace(/\s\s+/g, ' ').trim();
    if (textOnly.length >= 3) {
      pendingDescription = textOnly;
    }
  }
}
