import { RxCaretDown } from "react-icons/rx";

const Filter = ({
  ref,
  title,
  setShowDropdown,
  showDropdown,
  filters,
  setFilters,
  items,
}) => {
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
  }

  return (
    <div className="col flex items-center gap-5">
      <span className="text-white font-bold syne w-[80px]">{title}:</span>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 border rounded text-white bg-[#1e1e1e] w-32 text-left flex justify-between items-center border-[#777]"
        >
          {title === "Result"
            ? filters.result.charAt(0).toUpperCase() + filters.result.slice(1)
            : filters.color.charAt(0).toUpperCase() + filters.color.slice(1)}

          <RxCaretDown />
        </button>
        {showDropdown && (
          <ul className="absolute z-10 mt-1 bg-[#1e1e1e] border rounded w-32 text-white border-[#777]">
            {items.map((option) => (
              <li
                key={option}
                className="px-4 py-2 hover:bg-[#333] cursor-pointer"
                onClick={() => {
                  handleFilterChange(title.toLowerCase(), option);
                  setShowDropdown(false);
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Filter;
