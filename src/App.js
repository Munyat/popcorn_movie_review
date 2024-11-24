import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useKey } from "./hooks/usekey";
const key = "fc27f433";
const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);

  const [isLoading, setIsloading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  const [watched, setWatched] = useLocalStorage([], "watched");

  function handleSelectedMovie(id) {
    setSelectedMovieId((selectedid) => (id === selectedid ? null : id));
  }
  function handleCloseMovie() {
    setSelectedMovieId(null);
  }
  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }
  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchMovies() {
        try {
          setIsloading(true);
          setError("");
          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${key}&s=${query}`,
            { signal: controller.signal }
          );

          if (!res.ok) throw new Error("Something went wrong");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not found");
          setMovies(data.Search);
          setError("");
        } catch (err) {
          if (err.name !== "AbortError") setError(err.message);
        } finally {
          setIsloading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }
      handleCloseMovie();
      fetchMovies();
      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <Nav>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <SearchResults movies={movies} />
      </Nav>
      <Main>
        <MovieList>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <ListMovie movies={movies} onSelectMovie={handleSelectedMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </MovieList>
        <MovieList>
          {selectedMovieId ? (
            <MovieDetails
              selectedMovieId={selectedMovieId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              {" "}
              <MovieSummary watched={watched} />
              <WatchedMovieList
                watched={watched}
                onDeleteWatchedMovie={handleDeleteWatched}
              />
            </>
          )}
        </MovieList>
      </Main>
    </>
  );
}
function Loader() {
  return <p className="loader">Loading...</p>;
}
function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔</span>
      {message}
    </p>
  );
}
function Nav({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}
function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputRef = useRef();
  useKey("Enter", function () {
    if (document.activeElement === inputRef.current) return;

    inputRef.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      ref={inputRef}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function SearchResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}
function MovieList({ children }) {
  const [isOpen1, setIsOpen1] = useState(true);
  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen1((open) => !open)}
      >
        {isOpen1 ? "–" : "+"}
      </button>
      {isOpen1 && children}
    </div>
  );
}
function ListMovie({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie, i) => (
        <Movie movie={movie} key={i} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}
function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)} key={movie.imdbID}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}
function MovieDetails({
  selectedMovieId,
  onCloseMovie,
  onAddWatched,
  watched,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const counter = useRef(0);

  useEffect(() => {
    if (userRating) {
      counter.current++;
    }
  }, [userRating]);
  const isWatched = watched
    .map((movie) => movie.imdbID)
    .includes(selectedMovieId);
  const watchedUserRating = watched.find(
    (movie) => movie.imdbID === selectedMovieId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedMovieId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      counter: counter.current,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }
  useKey("Escape", onCloseMovie);
  // useEffect(
  //   function () {
  //     function callBack(e) {
  //       if (e.code === "Escape") {
  //         onCloseMovie();
  //       }
  //     }
  //     document.addEventListener("keydown", callBack);
  //     return function () {
  //       document.removeEventListener("keydown", callBack);
  //     };
  //   },
  //   [onCloseMovie]
  // );

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${key}&i=${selectedMovieId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedMovieId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;
      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );
  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                Released: {released} &bull; {runtime}
              </p>
              <p>Genre: {genre}</p>
              <p>Actors: {actors}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to list
                    </button>
                  )}
                </>
              ) : (
                <p>
                  {" "}
                  You rated this movie
                  <span> ⭐ </span>
                  {watchedUserRating}
                </p>
              )}
            </div>

            <p>
              <em>{plot}</em>
            </p>
            <p>Starring by {director}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function MovieSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}
function WatchedMovieList({ watched, onDeleteWatchedMovie }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <li key={movie.imdbID}>
          <img src={movie.poster} alt={`${movie.title} poster`} />
          <h3>{movie.title}</h3>
          <div>
            <p>
              <span>⭐️</span>
              <span>{movie.imdbRating}</span>
            </p>
            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>
            <p>
              <span>⏳</span>
              <span>{movie.runtime} min</span>
            </p>
            <button
              className="btn-delete"
              onClick={() => onDeleteWatchedMovie(movie.imdbID)}
            >
              X
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
