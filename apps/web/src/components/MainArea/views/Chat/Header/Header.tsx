import styles from "./Header.module.css";

const Header = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.nebulaOrb}></div>
      <div className={styles.msg}>A origem...</div>
    </div>
  );
};

export default Header;
