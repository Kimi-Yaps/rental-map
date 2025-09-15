import { useRef, useState } from "react";
import { ErrorType, OptionType } from "./Types";


interface IDropdown {
    initialValue?: OptionType;
    onValueUpdate?: (value: any) => void;
    options: OptionType[];
    error?: ErrorType;
    helpMessage?: string;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
    id?: string;
    required?: boolean;
}


const Dropdown = ({
    placeholder,
    disabled,
    initialValue,
    options,
    error,
    onValueUpdate,
    label,
    id,
    required
}: IDropdown) => {

    const [selected, setSelected] = useState<OptionType | null>(initialValue || null); 
    const [dropdown, setDropdown] = useState<boolean | null>(null);
    const [error, setError] = useState<ErrorType>(null);



    const handleClick = () => {
        setDropdown(!dropdown);
    };

    const handleItemClick = (option: OptionType) => {
        setSelected(option);
        setDropdown(!dropdown);
    };
const getStyle = () => {

        if (selected) {
        return "text-slate-600 border border-green-400 
bg-green-50 hover:border-purple-300 cursor-pointer";
        }

        if (disabled) {
        return "border-slate-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed";
        }

        if (error) {
        return "border border-red-500 bg-red-50 text-red-700 hover:border-blue-200 cursor-pointer";
        }

        return "text-slate-600 border-slate-400 hover:border-purple-300 cursor-pointer";

    };


    return (
        <>
            {label && <label htmlFor={id}></label>}

            <div ref={ref} className="w-full relative">
                <button
                type="button"
                disabled={disabled}
                id={id}
                // this also handles the 'Enter' key
                onClick={() => handleClick()}
                className={`w-full pl-[25px]
                text-base transition-all rounded-sm border focus:outline 
                focus:outline-purple-800
                ${getStyle()}
                `}
                >               
                    <div className="flex flex-row justify-between items-center h-
                    [60px]">
                        <p id={`${id}-option`}>
                        {selected ? selected.label : placeholder || "Please Select"}
                        </p>
                    </div>
                </button>

                {dropdown && (
                    <ul
                    className="max-h-80 overflow-y-auto bg-white z-50 absolute w-full border-b border-l border-r"
                    >   

                    {options && options.map((option: OptionType, i: number) => (
                        <li 
                        className={`w-full text-sm text-slate-600 p-5 border border-transparent cursor-pointer hover:bg-purple-50 focus:outline-2 focus:outline-purple-800
                       ${ selected === option && "bg-purple-200 text-slate-900" }
                       `}
                        onClick={() => handleItemClick(option)}
                        >                                   
                            {option.label}
                        </li>
                    ))}
                    </ul>
                )}
            </div>
        </>
    );

};



export default Dropdown;