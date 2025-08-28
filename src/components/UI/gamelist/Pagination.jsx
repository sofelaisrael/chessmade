import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";

const Pagination = ({currentPage, handleNextPage, handlePreviousPage, statsFilteredGames, gamesPerPage}) => {
  return (
    <div className="flex mt-4 text-white items-center gap-2 quicksand">
      <button
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
        className="p-2 border border-[#777] rounded-full disabled:opacity-50"
      >
        <MdNavigateBefore />
      </button>
      <span className="rounded-[100px] px-3 h-[40px] flex items-center justify-center">
        {currentPage} / {Math.ceil(statsFilteredGames.length / gamesPerPage)}
      </span>
      <button
        onClick={handleNextPage}
        disabled={
          currentPage === Math.ceil(statsFilteredGames.length / gamesPerPage)
        }
        className="p-2 border border-[#777] rounded-full disabled:opacity-50"
      >
        <MdNavigateNext />
      </button>
    </div>
  );
};

export default Pagination;
