import React, { useState, useEffect } from 'react';
import './Options.css';

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the saved option from Chrome storage when the component mounts
    chrome.storage.sync.get(['option'], (result) => {
      if (result.option) {
        setSelectedOption(result.option);
      }
    });
  }, []);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Save the selected option to Chrome storage
    chrome.storage.sync.set({ option: value }, () => {
      setSelectedOption(value);
    });
  };

  return (
    <div className="OptionsContainer">
      <div>
      </div>
    </div>
  );
};

export default Options;
