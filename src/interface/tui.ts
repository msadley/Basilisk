// src/interface/tui.ts

import promptSync from 'prompt-sync';
import { pingTest, stop } from '../networking/node-handling.js';

function displayMenu() : void {

  while (true) {
    // Setting up the prompt
    let count = 1;

    console.clear();
    console.log("Welcome to CCChat!");
    console.log(`${count++}. Ping Test`);
    console.log(`${count++}. Exit`);

    const answer = promptSync()("Option: ");

    switch (answer) {
      case '1':
        pingTest().then(() => {
          console.log("Ping test completed.");
        }).catch((error) => {
          console.error("An error occurred during the ping test:", error);
        });
        break;
      case '2':
        console.log("Exiting...");
        stop().then(() => {
          console.log("Node stopped successfully.");
          process.exit(0);
        }).catch((error) => {
          console.error("An error occurred while stopping the node:", error);
          process.exit(1);
        });
        break;
    }
  }
}
