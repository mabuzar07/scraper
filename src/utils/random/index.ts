export function randomWait(min: number, max: number) {
  return new Promise((resolve) => {
    const wait = Math.floor(Math.random() * (max - min + 1) + min);
    setTimeout(resolve, wait);
  });
}
