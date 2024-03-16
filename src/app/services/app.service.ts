import { Injectable } from '@angular/core';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor() { }

  showActions = async () => {
    const result = await ActionSheet.showActions({
      title: 'Photo Options',
      message: 'Select an option to perform',
      options: [
        {
          title: 'Upload',
        },
        {
          title: 'Share',
        },
        {
          title: 'Remove',
          style: ActionSheetButtonStyle.Destructive,
        },
      ],
    });

    //console.log('Action Sheet result:', result);
  };


}
