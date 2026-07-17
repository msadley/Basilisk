import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Icon } from "@iconify/react";
import { useLayoutStore } from "../../../../stores/LayoutStore";
import styles from "./ThemeSelector.module.css";

const themes = [
  { id: "mocha", name: "Mocha (Escuro)" },
  { id: "macchiato", name: "Macchiato" },
  { id: "frappe", name: "Frappé" },
  { id: "latte", name: "Latte (Claro)" },
] as const;

const ThemeSelector = () => {
  const theme = useLayoutStore((state) => state.theme);
  const setTheme = useLayoutStore((state) => state.setTheme);

  return (
    <Menu as="div" className={styles.menuContainer}>
      <MenuButton className={styles.themeButton} title="Mudar tema">
        <Icon icon="mingcute:palette-line" />
      </MenuButton>

      <MenuItems anchor="right end" className={styles.menuItems}>
        {themes.map((t) => (
          <MenuItem key={t.id}>
            <button
              onClick={() => setTheme(t.id)}
              className={`${styles.menuItem} ${theme === t.id ? styles.active : ""}`}
            >
              {t.name}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
};

export default ThemeSelector;
