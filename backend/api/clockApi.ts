import {
  nextEvent,
} from "gold-janus";

const eventEmitter = new EventTarget();

function tick() {
  return Date.now();
}

setInterval(
  () => {
    eventEmitter.dispatchEvent(new CustomEvent<number>(
      "tick",
      {
        detail: tick(),
      },
    ));
  },
  1000,
);

export async function* ticking(): AsyncGenerator<number> {
  yield tick();
  while (true) {
    const tickEvent = await nextEvent<CustomEvent<number>>(
      eventEmitter,
      "tick",
    );
    yield tickEvent.detail;
  }
}
