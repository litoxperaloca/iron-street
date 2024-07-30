import { Injectable } from '@angular/core';
import { ChatSession, Content, GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from 'src/environments/environment';
import {} from '@google-cloud/aiplatform';

@Injectable({
  providedIn: 'root'
})
export class VertexAIService {

// Access your API key as an environment variable (see "Set up your API key" above)
/*genAI = new GoogleGenerativeAI(environment.firebaseConfig.apiKey);
chatSession!:ChatSession;
chatHistory!: Content[];
systemInstruction:string="You are a helpful assistant, expert in user support tasks for app Iron Street. You should answer in Spanish unless user uses other language. You can access internet to find the best answer.";
model!:any;
constructor(){
  this.model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  //this.chatHistory = Content[];
  this.chatSession = this.model.startChat({history: this.chatHistory,systemInstruction: this.systemInstruction}) 

}

async run() {
  // For text-only input, use the gemini-pro model

  const prompt = "Write a story about a magic backpack."

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  //console.log(text);
}

//ADD A FUNCTION TO SEND A REQUEST TO A CHAT GENERATIVE AI including chat history
async chat(userQuestion: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await chat.sendMessage(userQuestion);
  const text = result.response.text();
  return text;
}

//ADD A FUNCTION TO SEND A REQUEST TO A TEXT GENERATIVE AI
async generateContent(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text;
}

//ADD A FUNCTION TO SEND A REQUEST TO A TEXT GENERATIVE AI
async generateText(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text;
}

//ADD A FUNCTION TO SEND A REQUEST TO A IMAGE GENERATIVE AI
async generateImage(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generateImage(prompt);
  const image = result.response.image();
  return image;
}

//ADD A FUNCTION TO SEND A REQUEST TO A AUDIO GENERATIVE AI
async generateAudio(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generateAudio(prompt);
  const audio = result.response.audio();
  return audio;
}

//ADD A FUNCTION TO SEND A REQUEST TO A VIDEO GENERATIVE AI
async generateVideo(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generateVideo(prompt);
  const video = result.response.video();
  return video;
}

//ADD A FUNCTION TO SEND A REQUEST TO A 3D MODEL GENERATIVE AI
async generate3DModel(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: "gemini-pro"});

  const result = await model.generate3DModel(prompt);
  const model = result.response.model();
  return model;
}
*/
}
