import {
  createResource,
  createEffect,
  createContext,
  useContext,
  createSignal,
  onMount,
  batch,
} from "solid-js";
import {
  getChatsByUserId,
  getMessagesInChat,
  sendMessage,
  pollingSubscriber,
} from "./api";
import { getCurrentHashValue, findUserInChats, normalizeByKey } from "./utils";
export const MessengerContext = createContext();

export function MessengerContextProvider(props) {
  const currentUserPublicKey = "a";

  const [
    currentOpenedCorrespondentPublicKey,
    setcurrentOpenedCorrespondentPublicKey,
  ] = createSignal(getCurrentHashValue());

  addEventListener("hashchange", () => {
    setcurrentOpenedCorrespondentPublicKey(getCurrentHashValue());
  });

  const [chats, setChats] = createSignal([]);
  const [messages, setMessages] = createSignal({});
  const [isInited, setIsInited] = createSignal(false);

  async function startPolling() {
    try {
      const activeChatPublicKey = currentOpenedCorrespondentPublicKey();
      const data = await pollingSubscriber();
      for (let publicKey in data) {
        if (publicKey === activeChatPublicKey) {
          const messagesToAdd = data[activeChatPublicKey];
          setMessages((value) => ({
            ...value,
            ...{
              [activeChatPublicKey]:
                value[activeChatPublicKey].concat(messagesToAdd),
            },
          }));
        } else {
          setChats((value) => {
            return {
              ...value,
              ...{
                [publicKey]: Object.assign({}, value[publicKey], {
                  lastMessage: data[publicKey].pop(),
                }),
              },
            };
          });
        }
      }
      setTimeout(() => startPolling(), 2000);
    } catch (error) {
      console.error(error);
    }
  }

  onMount(async () => {
    const userPublicKey = currentOpenedCorrespondentPublicKey();

    //init
    const [chats, messages] = await Promise.all([
      getChatsByUserId(currentUserPublicKey),
      userPublicKey !== "" ? getMessagesInChat(userPublicKey) : null,
    ]);

    batch(() => {
      setChats(normalizeByKey(chats, "publicKey"));
      setMessages(userPublicKey ? { [userPublicKey]: messages } : {});
      setIsInited(true);
    });

    startPolling();
  });

  createEffect(async () => {
    const currentCorrespondentPublicKey = currentOpenedCorrespondentPublicKey();
    if (
      currentCorrespondentPublicKey &&
      !messages[currentCorrespondentPublicKey]
    ) {
      //init
      const newMessages = await getMessagesInChat(
        currentCorrespondentPublicKey
      );
      setMessages((messages) => ({
        ...messages,
        ...{ [currentCorrespondentPublicKey]: newMessages },
      }));
    }
  });

  async function send(message) {
    const toPublicKey = currentOpenedCorrespondentPublicKey();
    const result = await sendMessage({
      toPublicKey,
      from: "a",
      message: message,
    });
    setMessages((value) => ({
      ...value,
      ...{
        [toPublicKey]: value[toPublicKey].concat(result),
      },
    }));

    setChats((value) => {
      return {
        ...value,
        ...{
          [toPublicKey]: Object.assign({}, value[toPublicKey], {
            lastMessage: result,
          }),
        },
      };
    });
  }

  return (
    <MessengerContext.Provider
      value={{
        chats: () => Object.values(chats()),
        messages: () => messages()[currentOpenedCorrespondentPublicKey()],
        currentCorrespondent: () =>
          chats()[currentOpenedCorrespondentPublicKey()],

        sendMessage: send,
      }}
    >
      {props.children}
    </MessengerContext.Provider>
  );
}

export function useMessenger() {
  return useContext(MessengerContext);
}
