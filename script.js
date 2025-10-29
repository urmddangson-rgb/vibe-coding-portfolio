// API 설정
const API_KEY = 'f9e68d9e14f7f32d45db7b5c5be7bca4';
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM 요소들
const moviesGrid = document.getElementById('moviesGrid');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

// 페이지 로드 시 영화 데이터 가져오기
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    
    // 스크롤 이벤트로 헤더 스타일 변경
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

// 현재 상영 중인 영화 데이터 가져오기
async function loadMovies() {
    try {
        showLoading();
        hideError();
        
        // 한국어와 영어 데이터를 병렬로 가져오기
        const [koResponse, enResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=ko-KR&page=1`),
            fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`)
        ]);
        
        if (!koResponse.ok || !enResponse.ok) {
            throw new Error(`HTTP error! status: ${koResponse.status || enResponse.status}`);
        }
        
        const [koData, enData] = await Promise.all([
            koResponse.json(),
            enResponse.json()
        ]);
        
        // 한국어와 영어 데이터를 영화 ID로 매칭하여 합치기
        const enMoviesMap = new Map();
        enData.results.forEach(movie => {
            enMoviesMap.set(movie.id, movie);
        });
        
        const combinedMovies = koData.results.map(koMovie => {
            const enMovie = enMoviesMap.get(koMovie.id);
            return {
                ...koMovie,
                title_ko: koMovie.title || '',
                overview_ko: koMovie.overview || '',
                title: enMovie?.title || koMovie.title || '',
                overview: enMovie?.overview || ''
            };
        });
        
        displayMovies(combinedMovies);
        
    } catch (err) {
        console.error('영화 데이터를 가져오는데 실패했습니다:', err);
        showError();
    }
}

// 영화 데이터를 화면에 표시
function displayMovies(movies) {
    hideLoading();
    
    if (!movies || movies.length === 0) {
        showError('영화 데이터가 없습니다.');
        return;
    }
    
    moviesGrid.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        moviesGrid.appendChild(movieCard);
    });
}

// 영화 카드 생성
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const posterUrl = movie.poster_path 
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Image';
    
    const releaseDate = movie.release_date 
        ? new Date(movie.release_date).getFullYear()
        : '미정';
    
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // 한글 제목과 영어 제목 표시 (항상 둘 다 표시)
    const koreanTitle = movie.title_ko || movie.title || '';
    const englishTitle = movie.title || movie.title_ko || '';
    
    const titleDisplay = `
        <span class="title-korean">${koreanTitle}</span>
        <span class="title-english">${englishTitle}</span>
    `;
    
    // 한글 줄거리와 영어 줄거리 표시 (항상 둘 다 표시)
    // overview_ko는 한국어 API에서 온 데이터, overview는 영어 API에서 온 데이터
    const koreanOverview = movie.overview_ko ? movie.overview_ko : (movie.overview ? movie.overview : '줄거리가 없습니다.');
    const englishOverview = movie.overview ? movie.overview : (movie.overview_ko ? movie.overview_ko : 'No overview available.');
    
    // 한글과 영어가 동일하면 한 번만 표시하지 않고 둘 다 표시
    const overviewDisplay = `
        <div class="overview-korean">${koreanOverview}</div>
        <div class="overview-english">${englishOverview}</div>
    `;
    
    card.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
        <div class="movie-info">
            <h3 class="movie-title">${titleDisplay}</h3>
            <div class="movie-overview">${overviewDisplay}</div>
            <div class="movie-rating">
                <span class="star">★</span>
                <span>${rating}</span>
            </div>
            <div class="movie-date">${releaseDate}</div>
        </div>
    `;
    
    // 카드 클릭 이벤트 (선택사항)
    card.addEventListener('click', () => {
        showMovieDetails(movie);
    });
    
    return card;
}

// 영화 상세 정보 표시 (모달 또는 새 페이지)
function showMovieDetails(movie) {
    // 간단한 알림으로 영화 정보 표시
    const message = `
        제목: ${movie.title}
        평점: ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
        개봉일: ${movie.release_date || '미정'}
        줄거리: ${movie.overview || '줄거리가 없습니다.'}
    `;
    
    alert(message);
}

// 로딩 상태 표시
function showLoading() {
    loading.style.display = 'block';
    moviesGrid.style.display = 'none';
}

// 로딩 상태 숨기기
function hideLoading() {
    loading.style.display = 'none';
    moviesGrid.style.display = 'grid';
}

// 에러 상태 표시
function showError(message = '영화를 불러오는데 실패했습니다. 다시 시도해주세요.') {
    error.style.display = 'block';
    error.querySelector('p').textContent = message;
    moviesGrid.style.display = 'none';
    loading.style.display = 'none';
}

// 에러 상태 숨기기
function hideError() {
    error.style.display = 'none';
}

// 이미지 로드 에러 처리
document.addEventListener('DOMContentLoaded', () => {
    // 동적으로 추가되는 이미지들에 대한 에러 처리
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('movie-poster')) {
            e.target.src = 'https://via.placeholder.com/500x750/1a1a1a/ffffff?text=No+Image';
        }
    }, true);
});

// 무한 스크롤 기능 (선택사항)
let isLoading = false;
let currentPage = 1;

window.addEventListener('scroll', () => {
    if (isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    if (scrollTop + clientHeight >= scrollHeight - 1000) {
        loadMoreMovies();
    }
});

async function loadMoreMovies() {
    if (isLoading) return;
    
    isLoading = true;
    currentPage++;
    
    try {
        // 한국어와 영어 데이터를 병렬로 가져오기
        const [koResponse, enResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=ko-KR&page=${currentPage}`),
            fetch(`${API_BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=${currentPage}`)
        ]);
        
        if (!koResponse.ok || !enResponse.ok) {
            throw new Error(`HTTP error! status: ${koResponse.status || enResponse.status}`);
        }
        
        const [koData, enData] = await Promise.all([
            koResponse.json(),
            enResponse.json()
        ]);
        
        // 한국어와 영어 데이터를 영화 ID로 매칭하여 합치기
        const enMoviesMap = new Map();
        enData.results.forEach(movie => {
            enMoviesMap.set(movie.id, movie);
        });
        
        const combinedMovies = koData.results.map(koMovie => {
            const enMovie = enMoviesMap.get(koMovie.id);
            return {
                ...koMovie,
                title_ko: koMovie.title || '',
                overview_ko: koMovie.overview || '',
                title: enMovie?.title || koMovie.title || '',
                overview: enMovie?.overview || ''
            };
        });
        
        if (combinedMovies && combinedMovies.length > 0) {
            combinedMovies.forEach(movie => {
                const movieCard = createMovieCard(movie);
                moviesGrid.appendChild(movieCard);
            });
        }
        
    } catch (err) {
        console.error('추가 영화 데이터를 가져오는데 실패했습니다:', err);
        currentPage--; // 실패 시 페이지 번호 되돌리기
    } finally {
        isLoading = false;
    }
}

// 검색 기능 (선택사항)
async function searchMovies(query) {
    if (!query.trim()) {
        loadMovies();
        return;
    }
    
    try {
        // 한국어와 영어 검색 결과를 병렬로 가져오기
        const [koResponse, enResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/search/movie?api_key=${API_KEY}&language=ko-KR&query=${encodeURIComponent(query)}`),
            fetch(`${API_BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}`)
        ]);
        
        if (!koResponse.ok || !enResponse.ok) {
            throw new Error(`HTTP error! status: ${koResponse.status || enResponse.status}`);
        }
        
        const [koData, enData] = await Promise.all([
            koResponse.json(),
            enResponse.json()
        ]);
        
        // 한국어와 영어 데이터를 영화 ID로 매칭하여 합치기
        const enMoviesMap = new Map();
        enData.results.forEach(movie => {
            enMoviesMap.set(movie.id, movie);
        });
        
        const combinedMovies = koData.results.map(koMovie => {
            const enMovie = enMoviesMap.get(koMovie.id);
            return {
                ...koMovie,
                title_ko: koMovie.title || '',
                overview_ko: koMovie.overview || '',
                title: enMovie?.title || koMovie.title || '',
                overview: enMovie?.overview || ''
            };
        });
        
        displayMovies(combinedMovies);
        
    } catch (err) {
        console.error('검색 중 오류가 발생했습니다:', err);
        showError('검색 중 오류가 발생했습니다.');
    }
}

// 키보드 이벤트 처리
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // ESC 키로 모달 닫기 등
    }
});

// 반응형 이미지 로딩 최적화
function optimizeImageLoading() {
    const images = document.querySelectorAll('.movie-poster');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// 페이지 로드 완료 후 이미지 최적화 적용
window.addEventListener('load', optimizeImageLoading);
