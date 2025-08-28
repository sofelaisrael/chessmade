import { BiMinus, BiPlus } from "react-icons/bi";
import { TiEquals } from "react-icons/ti";

const FilterItem = ({ game, playerColor, onSelectGame, k }) => {
  return (
    <li
      key={k}
      onClick={() => onSelectGame(game)}
      className="border rounded-lg p-4 text-white border-[#494949] cursor-pointer bg-[#1e1e1e] hover:bg-[#1a1a1a] w-[250px] max-md:w-full flex- max-xl:w-[200px] max-lg:w-[250px] "
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="text-sm font-medium flex items-center gap-1 truncate w-[80%]">
            vs.{" "}
            <div
              className={`size-3 shrink-0 rounded-full border ${
                playerColor === "black"
                  ? "bg-white border-black"
                  : "border-white bg-black"
              }`}
            ></div>
            <div className="truncate">
              {playerColor === "white"
                ? game.black.username
                : game.white.username}
            </div>
          </div>
          <span className="text-xs text-gray-400 shrink-0">
            {new Date(game.end_time * 1000).toLocaleDateString("en-GB", {
              day: "2-digit",
              weekday: "short",
            })}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {game.time_class.toUpperCase()}
          </span>
          <span className="text-xs text-gray-400">
            {game.rated ? "Rated" : "Unrated"}
          </span>
        </div>

        <div className="flex justify-between mt-2">
          {playerColor === "white" ? (
            game.white.result === "win" ? (
              <BiPlus className="text-green-500" />
            ) : game.black.result === "win" ? (
              <BiMinus className="text-red-500" />
            ) : (
              <TiEquals className="text-gray-400" />
            )
          ) : game.black.result === "win" ? (
            <BiPlus className="text-green-500" />
          ) : game.white.result === "win" ? (
            <BiMinus className="text-red-500" />
          ) : (
            <TiEquals className="text-gray-400" />
          )}

          <span className="text-gray-400 text-xs">
            {playerColor === "black" ? game.black.rating : game.white.rating}
          </span>
        </div>
      </div>
    </li>
  );
};

export default FilterItem;
