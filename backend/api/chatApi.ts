import {
  nextEvent,
  type UploadedFile,
} from "gold-janus";

const eventEmitter = new EventTarget();
let imageBase64Url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQoU2NkYGD4z0AEYBxVSFQAAJ8ABJqj3XoAAAAASUVORK5CYII=";
let chat = "test";

export async function* streamChat(): AsyncGenerator<string> {
  yield chat;
  while (true) {
    await nextEvent(
      eventEmitter,
      "chat",
    );
    yield chat;
  }
}

export async function* streamBase64ImageUrl(): AsyncGenerator<string> {
  yield imageBase64Url;
  while (true) {
    await nextEvent(
      eventEmitter,
      "image",
    );
    yield imageBase64Url;
  }
}

export async function setImage(file: UploadedFile): Promise<void> {
  const base64 = (await file.readAsBuffer()).toString("base64");
  const contentType = file.contentType || "application/octet-stream";
  imageBase64Url = `data:${contentType};base64,${base64}`;
  eventEmitter.dispatchEvent(new CustomEvent<string>("image"));
}

export async function setChat(newChat: string): Promise<void> {
  chat = newChat;
  eventEmitter.dispatchEvent(new CustomEvent<string>("chat"));
}
