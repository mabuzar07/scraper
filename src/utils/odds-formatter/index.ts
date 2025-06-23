/**
 * Converts fractional odds to decimal odds
 * @param fractional - The fractional odds as a string (e.g., "3/1", "5/2")
 * @returns The decimal odds (fractional value + 1)
 */
export function fractionalToDecimal(fractional: string): number {
  // Split the fraction by "/"
  const parts = fractional.split("/");

  if (parts.length !== 2) {
    throw new Error('Invalid fractional format. Expected format: "numerator/denominator"');
  }

  const numerator = parseFloat(parts[0]);
  const denominator = parseFloat(parts[1]);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    throw new Error("Invalid numbers in fractional odds");
  }

  // Calculate decimal odds: (numerator / denominator) + 1
  return numerator / denominator;
}

// Example usage:
// fractionalToDecimal("3/1") returns 4.0
// fractionalToDecimal("5/2") returns 3.5
// fractionalToDecimal("1/2") returns 1.5
