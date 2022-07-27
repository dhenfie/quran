/**
 * simple quran app
 * build with pure javascript
 *
 * @author Fajar Susilo <fajarsusilo1600@gmail.com>
 * @link <https://github.com/dhenfie/e-quran
 * @license MIT
 */

'use strict';

const OFFCANVAS = document.querySelector('.offcanvas');
const OFFCANVAS_TOGGLE = document.querySelector('.offcanvas-toggle');
const NEXT_PAGE = document.querySelector('[data-link="next"]');
const PREV_PAGE = document.querySelector('[data-link="prev"]');

class EventDispatcher {
    constructor() {
        /** @private */
        this.events = ['onStart', 'onView', 'onNextPage', 'onPrevPage'];
        /** @private */
        this.eventListener = {
            onStart: [],
            onView: [],
            onNextPage: [],
            onPrevPage: [],
        };
    }

    /**
     * @param {'onStart'|'onView'|'onNextPage'|'onPrevPage'} type
     * @param {CallableFunction} handle
     */
    listen(type, handle) {
        const _eventListener = this.eventListener;
        if (Object.hasOwn(_eventListener, type)) {
            this.eventListener[type] = Array.from(_eventListener[type]).concat([
                { handle },
            ]);
        }
    }

    /**
     * @param {'onStart'|'onView'|'onNextPage'|'onPrevPage'} type
     * @param {object} [context]
     */
    dispatch(type, context) {
        const _eventListener = this.eventListener;
        if (Object.hasOwn(_eventListener, type)) {
            _eventListener[type].forEach((eventHandler) => {
                eventHandler.handle(context);
            });
        }
    }
}

/** @param {{id: number, name: string}}  elementStructure*/
function createMenuInOffCanvas(elementStructure) {
    // container element
    const target = document.querySelector('.offcanvas-content');
    const element = document.createElement('div');
    const items = `<span class="number">${elementStructure.id}</span> <span class="entry">${elementStructure.name}</span>`;
    element.innerHTML = items;
    element.setAttribute('data-viewId', elementStructure.id);
    element.className = 'offcanvas-content__entry';
    target.appendChild(element);
    // register event listener
    element.addEventListener('click', (e) => {
        // dispatch events 'onView'
        events.dispatch('onView', {
            id: elementStructure.id,
            name: elementStructure.name,
        });
    });
}

/**
 * @param {'list'|'view'} type
 * @param {number} [id]
 */
async function setUI(type, id) {
    let request = null;
    setLoader(true);

    if (type === 'list') {
        request = new Request('https://quranapi.idn.sch.id/surah', {
            method: 'GET',
            cache: 'force-cache',
        });

        const fetching = await fetch(request);
        const result = await fetching.json();
        result.data.forEach((_array) => {
            createMenuInOffCanvas({ id: _array.number, name: _array.name });
        });
        setLoader(false);
    } else {
        request = new Request('https://quranapi.idn.sch.id/surah/' + id, {
            method: 'GET',
            cache: 'force-cache',
        });
        const fetching = await fetch(request);
        const result = await fetching.json();
        setItem('surah_name_latin', result.name);
        document.getElementById('card').innerHTML = '';
        result.ayahs.forEach((_array) => {
            generateAyah(_array);
        });
        setLoader(false);
    }
}

/** @param {boolean} state */
function setLoader(state) {
    const target = document.querySelector('.spinner-loading');
    if (state) {
        target.classList.add('active');
        return;
    }
    target.classList.remove('active');
}

/** @param {number} state */
function setPage(state) {
    const setPrev = state === 1 ? 1 : state - 1;
    const setNext = state;

    NEXT_PAGE.setAttribute('data-page', setNext);
    PREV_PAGE.setAttribute('data-page', setPrev);
}

/** @param {number} state */
function setCurrentActiveElement(state) {
    const setActive = document.querySelector('[data-viewID="' + state + '"]');
    const allElement = document.querySelectorAll('.offcanvas-content__entry');
    allElement.forEach((element) => {
        if (element.classList.contains('active')) {
            element.classList.remove('active');
        }
    });
    setActive.classList.add('active');
}

/** @param {object} obj */
function generateAyah(obj) {
    const target = document.getElementById('card');
    const _cardTitle = `<div class="card-title">${obj.ayahText}</div>`;
    const _cardSubTitle = `<div class="card-subtitle">${obj.readText}</div>`;
    const _cardBody = document.createElement('div');
    _cardBody.innerHTML = `<div class="content-card">${_cardTitle + _cardSubTitle}</div>`
    target.appendChild(_cardBody);
}

/**
 *  @param {string} type
 *  @param {string} value
 */
function setItem(type, value) {
    const query = document.querySelectorAll('[data-items="' + type + '"]');
    query.forEach((element) => {
        element.textContent = value;
    });
}

// application start
const events = new EventDispatcher();

events.listen('onStart', () => {
    OFFCANVAS_TOGGLE.addEventListener('click', (e) => {
        if (OFFCANVAS.classList.contains('active')) {
            OFFCANVAS.classList.remove('active');
            OFFCANVAS_TOGGLE.innerHTML =
                '<i class="bi bi-arrow-bar-right"></i>';
            return;
        }
        OFFCANVAS.classList.add('active');
        OFFCANVAS_TOGGLE.innerHTML = '<i class="bi bi-arrow-bar-left"></i>';
    });
    NEXT_PAGE.addEventListener('click', (e) => {
        events.dispatch('onNextPage', {
            nextPage: NEXT_PAGE.getAttribute('data-page'),
        });
    });
    PREV_PAGE.addEventListener('click', (e) => {
        events.dispatch('onPrevPage', {
            prevPage: PREV_PAGE.getAttribute('data-page'),
        });
    });
});

events.listen('onStart', (context) => {
    setUI('list');
    setUI('view', 1);
});

events.listen('onView', (ctx) => {
    const goTo = parseInt(ctx.id);
    setPage(goTo);
    setUI('view', ctx.id);
    setCurrentActiveElement(goTo);
});

// next Page
events.listen('onNextPage', ({ nextPage }) => {
    const goTo = parseInt(nextPage);
    console.log(nextPage);
    if (goTo >= 114) {
        setPage(114);
        setUI('view', 114);
        setCurrentActiveElement(114);
    } else {
        setPage(goTo + 1);
        setUI('view', goTo + 1);
        setCurrentActiveElement(goTo + 1);
    }
});

// prev page
events.listen('onPrevPage', ({ prevPage }) => {
    const goTo = parseInt(prevPage);
    if (goTo > 1) {
        setPage(goTo);
        setUI('view', goTo);
        setCurrentActiveElement(goTo);
    } else {
        setUI('view', 1);
        setCurrentActiveElement(1);
    }
});

// mount app
window.onload = events.dispatch('onStart', {});
