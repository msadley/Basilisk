import styles from "./Welcome.module.css"

function Welcome() {
  return (
    <div className={styles.welcome}>
      <div className={styles.body}>
        <img src="/basilisk.svg" alt="logo" />
        <h1>Bem-vindo ao Basilisk</h1>
      </div>
    </div>
  )
}

export default Welcome;
