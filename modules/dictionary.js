import {parse} from './csv.js';

const ENGLISH = 'ENG';
const SPANISH = 'ESP';
const UNSPECIFIED = 'no especificado';

function *zip (...iterables){
    let iterators = iterables.map(i => i[Symbol.iterator]() )
    while (true) {
        let results = iterators.map(iter => iter.next() )
        if (results.some(res => res.done) ) return
        else yield results.map(res => res.value )
    }
};

function intersects(list1, list2){
	for(const x of list1){
		if(list2.includes(x)){
			return true;
		}
	}
	return false;
};

function divclass(cla, contents){
	const div = document.createElement('div');
	div.classList.add(cla);
	if(contents){
		//const t = document.createTextNode(contents);
		//div.appendChild(t);
		div.innerHTML = contents;
	}
	return div;	
};

function spanclass(cla, contents){
	const span = document.createElement('span');
	span.classList.add(cla);
	if(contents){
		//const t = document.createTextNode(contents);
		//span.appendChild(t);
		span.innerHTML = contents;
	}
	return span;	
};

function defn_html(def){
	const eng = divclass("english");
	const esp = divclass("spanish");
	
	eng.appendChild(spanclass("word", def.ENG));
	eng.appendChild(spanclass("part", ' ('+def.part_of_speech+')'));
	if(def.definition_ENG){
		eng.appendChild(divclass("definition", def.definition_ENG));
	}
	if(def.example_ENG){
		eng.appendChild(divclass("example", 'Example: '+def.example_ENG));
	}
	
	esp.appendChild(spanclass("word", def.ESP));
	if(def.part_of_speech === 'Noun'){esp.appendChild(spanclass("part", ' (Sustantivo, '+def.gender+')'));
	} else {
		esp.appendChild(spanclass("part", ' ('+def.part_of_speech+')'));
	}
	
	if(def.definition_ESP){
		esp.appendChild(divclass("definition", def.definition_ESP));
	}
	if(def.example_ESP){
		esp.appendChild(divclass("example", 'Ejemplo: '+def.example_ESP));
	}
	
	const columns = divclass('twocol');
	for(const col of [esp, eng]){
		columns.appendChild(col);
	}
	
	const div = divclass("entry");
	div.appendChild(columns);
	if(def.sources){
		div.appendChild(divclass("references", 'References/Referencias: '+def.sources));
	}
	if(def.areas[0] !== UNSPECIFIED){
		div.appendChild(divclass("subjects", "areas/áreas: "+def.areas));
	}
	
	return div;
};


function normalize(str){
	return (str
		.toLowerCase()
		.normalize()
		.replaceAll('á','a')
		.replaceAll('é','e')
		.replaceAll('í','i')
		.replaceAll('ó','o')
		.replaceAll('ú','u')
		.replaceAll('ñ','n')
	);
};


const ARTICLES = Object.freeze({
	[ENGLISH]: "the a an".split(' '),
	[SPANISH]: "el la lo los las".split(' ')
});

function sort_key(defn){
	const keys = {};
	for(const [lang, articles] of Object.entries(ARTICLES)){
		let key = normalize(defn[lang]);
		key = key.replaceAll(/ *\([^)]*\) */g, "");
		for(const article of articles){
			key = key.replaceAll(RegExp("\\b"+article+"\\b", "g"), "")
		};
		key = key.replaceAll(/\s{2,}/g, " ");
		key = key.trim();
		keys[lang] = key;
	};
	return keys;
};


function parse_dictionary(csv_string){
	const headings = {};
	for(const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ"){
		headings[letter.toLowerCase()] = divclass('letter', letter);
	}
	
	const areas = {};
	
	const csv_arr = parse(csv_string);
	const csv_headings = csv_arr.shift();
	const definitions = csv_arr.map(row => Object.fromEntries(zip(csv_headings, row)));
	
	for(const defn of definitions){	
		defn.search_body = ("ESP,ENG,definition_ESP,definition_ENG,example_ESP,example_ENG"
			.split(",")
			.map(x => normalize(defn[x]))
			.join(';;')
		);
		
		defn.areas = defn.areas.split(',').map(s => s.trim()).sort();
		if(defn.areas[0] === ""){
			defn.areas = [UNSPECIFIED];
		}
		for(const a of defn.areas){
			areas[a] = areas[a] || [];
			areas[a].push(defn);
		}
		
		defn.sort_key = sort_key(defn);
		defn.heading = {};
		for(const [language, key] of Object.entries(defn.sort_key)){
			defn.heading[language] = headings[key[0]];
		}
		
		defn.html = defn_html(defn);
	}
	
	const headings_interleaver = (
		Object.entries(headings)
		.map(function([letter, html]){
			const sort_key = {[ENGLISH]:letter, [SPANISH]:letter};
			return {html, sort_key};
		})
	);
	const sorted = {}
	for(const language of [ENGLISH, SPANISH]){
		const other_language = language === ENGLISH ? SPANISH : ENGLISH;
		sorted[language] = [...definitions, ...headings_interleaver].sort(
			function(a, b){
				const keya = a.sort_key[language]
				const keyb = b.sort_key[language]
				if(keya<keyb){
					return -1;
				}
				if(keyb<keya){
					return 1;
				}
				const keya2 = a.sort_key[other_language]
				const keyb2 = b.sort_key[other_language]
				if(keya2 < keyb2){
					return -1;
				}
				if(keyb2 < keya2){
					return 1;
				}
				return 0
			}
		).map(x => x.html);
	}

	return {definitions, headings, sorted, areas};
};

function makeDictionary(csv_string, container, getLanguage, getFilters, getSearchString){
	const dictionary = parse_dictionary(csv_string);
	const search_cache = {'':new Set(dictionary.definitions)};
	while(container.firstChild){
		container.removeChild(container.firstChild);
	}	
	sort();
	filter();
	search();
	
	return Object.freeze({sort, filter, search, areas:Object.keys(dictionary.areas)});
	
	
	
	function sort(){
		const language = getLanguage();
		for(const div of dictionary.sorted[language]){
			container.appendChild(div);
		}
		updateHeadings();
	};
	
	function updateHeadings(){
		const language = getLanguage();
		const visible = new Set(dictionary.definitions
			.filter(function(x){
				const classlist = x.html.classList;
				return !(classlist.contains("subjectFiltered") || classlist.contains("searchFiltered"));
			})
			.map(x => x.heading[language])
		)
		for(const head of Object.values(dictionary.headings)){
			head.classList.toggle('headingFiltered', !visible.has(head))
		}
	};
	
	function filter(){
		const visible = new Set();
		for(const f of getFilters()){
			for(const defn of dictionary.areas[f]){
				visible.add(defn);
			}
		}
		for(const defn of dictionary.definitions){
			defn.html.classList.toggle('subjectFiltered', visible.has(defn));
		}
		updateHeadings();
	};
	
	function getMatchSet(str){
		if(Object.hasOwn(search_cache, str)){
			return search_cache[str]
		}
		let start = str;
		while(!Object.hasOwn(search_cache, start)){
			start = start.slice(0, -1);
		}
		const result = new Set([...search_cache[start]]
			.filter(def => def.search_body.includes(str))
		);
		search_cache[str] = result;
		return result;
	};
	
	function search(){
		const match_set = getMatchSet(normalize(getSearchString()));
		for(const defn of dictionary.definitions){
			defn.html.classList.toggle('searchFiltered', !match_set.has(defn));
		}
		updateHeadings();
	};
}

export {makeDictionary, ENGLISH, SPANISH};