// src/interface/tui.ts

import readline from 'readline';
import { pingTest, stop } from '../networking/node-handling.js';
import { transpileModule } from 'typescript';

export async function menu() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function prompt(query: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  while (true) {
    // Setting up the prompt
    let count = 1;

    console.clear();
    console.log("Welcome to CCChat!");
    console.log(`${count++}. Ping Test`);
    console.log(`${count++}. Exit`);

    const answer : string = await prompt("Please select an option: ");
    console.log('\n');

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
