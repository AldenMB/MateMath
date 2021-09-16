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

function normalize(str){
	return (str
		.toLowerCase()
		.normalize()
		.replace('á','a')
		.replace('é','e')
		.replace('í','i')
		.replace('ó','o')
		.replace('ú','u')
		.replace('ñ','n')
	);
};

function parse_dictionary(csv_string){
	const arr = parse(csv_string);
	const headings = arr.shift();
	function to_obj(row){
		return Object.fromEntries(zip(headings, row));
	}
	const defns = arr.map(to_obj)
	for(const defn of defns){
		defn.areas = defn.areas.split(',').map(s => s.trim()).sort();
		if(defn.areas[0] === ""){
			defn.areas = [UNSPECIFIED];
		}
	}
	return defns;
};

function divclass(cla, contents){
	const div = document.createElement('div');
	div.classList.add(cla);
	if(contents){
		const t = document.createTextNode(contents);
		div.appendChild(t);
	}
	return div;	
};

function spanclass(cla, contents){
	const span = document.createElement('span');
	span.classList.add(cla);
	if(contents){
		const t = document.createTextNode(contents);
		span.appendChild(t);
	}
	return span;	
};

function defn_html(def, language){
	const eng = divclass("english");
	const esp = divclass("spanish");
	
	eng.appendChild(spanclass("word", def.ENG));
	eng.appendChild(spanclass("part", '('+def.part_of_speech+')'));
	if(def.definition_ENG){
		eng.appendChild(divclass("definition", def.definition_ENG));
	}
	if(def.example_ENG){
		eng.appendChild(divclass("example", 'Example: '+def.example_ENG));
	}
	
	esp.appendChild(spanclass("word", def.ESP));
	esp.appendChild(spanclass("part", '('+def.part_of_speech+')'));
	if(def.definition_ESP){
		esp.appendChild(divclass("definition", def.definition_ESP));
	}
	if(def.example_ESP){
		esp.appendChild(divclass("example", 'Ejemplo: '+def.example_ESP));
	}
	
	const columns = divclass('twocol');
	const order = (language === ENGLISH) ? [eng, esp] : [esp, eng];
	for(const col of order){
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

function makeDictionary(csv_string){
	const base_dictionary = parse_dictionary(csv_string);
		
	return Object.freeze({toHTML, getSubjectAreas});
	
	function toHTML(primary_language, active_filters, search_string){
		let reduced_dict = base_dictionary.filter(
			defn => intersects(active_filters, defn.areas)
		);
		if(search_string){
			reduced_dict = reduced_dict.filter(
				defn => Object.values(defn).filter(x => typeof(x) === "string").some(x => normalize(x).includes(normalize(search_string)))
			);
		};
		reduced_dict.sort(function compare(a,b){
			if(a[primary_language] < b[primary_language]){
				return -1;
			}
			if(a[primary_language] > b[primary_language]){
				return 1
			}
			if(a[primary_language] === b[primary_language]){
				const sec = primary_language === ENGLISH ? SPANISH : ENGLISH;
				return 1-2*(a[sec] < b[sec]);
			}
		});
		const div = document.createElement('div');
		div.id = "dictionary";
		for(const defn of reduced_dict){
			div.appendChild(defn_html(defn, primary_language));
		}
		return div;
	};
	
	function getSubjectAreas(){
		const areas = new Set();
		for(const defn of base_dictionary){
			for(const a of defn.areas){
				areas.add(a);
			}
		}
		return areas;
	};
}

export {makeDictionary, ENGLISH, SPANISH};