import { Injectable } from '@angular/core';
import { Dialog } from '@capacitor/dialog';


@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor() { }

  showAlert = async (title: String, message: String) => {
    return await Dialog.alert({
      title: 'Stop',
      message: 'this is an error',
    });
  };

  showConfirm = async (title: String, question: String, okText: String, cancelText: String) => {
    const { value } = await Dialog.confirm({
      title: 'Confirm',
      message: `Are you sure you'd like to press the red button?`,
    });

    //console.log('Confirmed:', value);
  };

  showPrompt = async (title: String, promptText: String, okText: String, cancelText: String) => {
    const { value, cancelled } = await Dialog.prompt({
      title: 'Hello',
      message: `What's your name?`,
    });

    //console.log('Name:', value);
    //console.log('Cancelled:', cancelled);
  };
}
