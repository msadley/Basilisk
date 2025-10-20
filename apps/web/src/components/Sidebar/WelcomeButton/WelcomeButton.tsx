import styles from "./WelcomeButton.module.css";

export type WelcomeButtonProps = {
  onClick: () => void;
};

function WelcomeButton({ onClick }: WelcomeButtonProps) {
  return (
    <div className={styles.welcomeButton} onClick={onClick}>
      <img src="/basilisk.svg" alt="logo" />
    </div>
  );
}

export default WelcomeButton;
