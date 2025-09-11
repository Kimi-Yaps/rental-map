import { gsap } from "gsap";

function pixelatedRevealAnimation(ref, color) {
  const container = ref.current;
  const width = container.offsetWidth;
  const height = container.offsetHeight;
  const pixelSize = 20;
  const totalColumns = Math.ceil(width / pixelSize);
  const totalRows = Math.ceil(height / pixelSize);
  const pixels = [];

  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < totalColumns; col++) {
      const pixel = document.createElement("div");
      pixel.style.position = "absolute";
      pixel.style.width = `${pixelSize}px`;
      pixel.style.height = `${pixelSize}px`;
      pixel.style.backgroundColor = color;
      pixel.style.top = `${row * pixelSize}px`;
      pixel.style.left = `${col * pixelSize}px`;
      container.appendChild(pixel);
      pixels.push(pixel);
    }
  }

  gsap.set(pixels, { autoAlpha: 0 });
  
  gsap.to(pixels, {
    autoAlpha: 1,
    duration: 1,
    stagger: {
      amount: 1,
      grid: [totalRows, totalColumns],
      from: "random"
    },
    onComplete: () => {
      pixels.forEach(pixel => pixel.remove());
    }
  });
}

export default pixelatedRevealAnimation;
