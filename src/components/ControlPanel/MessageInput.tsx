import { Accessor, createEffect, createSignal, Setter } from "solid-js";
import type { JSX } from 'solid-js';

export function MessageInput(props: {
  onSubmit: (event: JSX.EventHandler<HTMLFormElement, SubmitEvent>) => Promise<void>;
  id: string;
  name: string;
  value: Accessor<string>
  setValue: Setter<string>
  maxLength: number;
  required: boolean;
}) {
  const [rows, setRows] = createSignal(1);

  const handleChange = (event) => {
    const minRows = 1;
    const maxRows = 10;
    const textareaLineHeight = 24;

    const previousRows = event.target.rows;
    event.target.rows = minRows; // reset number of rows in textarea

    const currentRows = ~~(event.target.scrollHeight / textareaLineHeight);

    if (currentRows === previousRows) {
      event.target.rows = currentRows;
    }

    if (currentRows >= maxRows) {
      event.target.rows = maxRows;
      event.target.scrollTop = event.target.scrollHeight;
    }

    setRows(currentRows < maxRows ? currentRows : maxRows);
    props.setValue(event.currentTarget.value)
  };

  const onKeyPress = (event) => {
    if (event.which === 13 && !event.shiftKey) {
      event.preventDefault();
      setRows(1);
      props.onSubmit(event);
    }
  };

  createEffect(() => {
    if (props.value() === "") {
      setRows(1)
    }
  })

  return (
    <textarea
      id={props.id}
      name={props.name}
      rows={rows()}
      value={props.value()}
      maxLength={props.maxLength}
      onInput={handleChange}
      required={props.required}
      onKeyPress={onKeyPress}
      class="block resize-none mx-4 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Your message..."
    ></textarea>
  );
}
