import {
  ApiError,
  nextEvent,
} from "gold-janus";

const eventEmitter = new EventTarget();

interface User {
  name: string;
  age: number;
}

const users: User[] = [
  {
    name: "Alice",
    age: 32,
  },
  {
    name: "Bob",
    age: 25,
  },
];

export async function* streamListUsers(): AsyncGenerator<User[]> {
  yield users;
  while (true) {
    await nextEvent(
      eventEmitter,
      "users",
    );
    yield users;
  }
}

export async function createUser(user: User): Promise<User> {
  const newUser: User = {
    name: user.name,
    age: user.age,
  };
  users.push(newUser);
  eventEmitter.dispatchEvent(new CustomEvent<User[]>("users"));
  return newUser;
}

function checkUserIndex(index: number): void {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= users.length
  ) {
    throw new ApiError(
      400,
      "Invalid user index",
    );
  }
}

export async function updateUser(index: number, user: User): Promise<User> {
  checkUserIndex(index);
  users[index].name = user.name;
  users[index].age = user.age;
  eventEmitter.dispatchEvent(new CustomEvent<User[]>("users"));
  return users[index];
}

export async function getByIndex(index: number): Promise<User> {
  checkUserIndex(index);
  return users[index];
}

export async function deleteUser(index: number): Promise<User> {
  checkUserIndex(index);
  const [
    deleted,
  ] = users.splice(
    index,
    1,
  );
  eventEmitter.dispatchEvent(new CustomEvent<User[]>("users"));
  return deleted;
}
