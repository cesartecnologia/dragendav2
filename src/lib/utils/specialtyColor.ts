export type SpecialtyColor = {
  background: string;
  border: string;
  text: string;
};

const palette: SpecialtyColor[] = [
  { background: "#E8F1F8", border: "#9BB9D4", text: "#315B78" },
  { background: "#EAF4EF", border: "#9FC9B4", text: "#37684F" },
  { background: "#F6EFE8", border: "#D0B49B", text: "#755B42" },
  { background: "#F8EDED", border: "#D9A4A0", text: "#7A3F3A" },
  { background: "#F7F2DF", border: "#D7C27B", text: "#74622A" },
  { background: "#EEEAF7", border: "#B6A8D8", text: "#55487D" },
  { background: "#E8F3F4", border: "#93C2C8", text: "#2E6670" },
  { background: "#F4EAF1", border: "#D2A2C4", text: "#744564" },
];

export const getSpecialtyColor = (specialty: string): SpecialtyColor => {
  const normalized = specialty.trim().toLowerCase();
  const hash = normalized.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? palette[0];
};
