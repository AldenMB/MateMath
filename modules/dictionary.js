import {parse} from './csv.js';

const ENGLISH = 'ENG';
const SPANISH = 'ESP';

function *zip (...iterables){
    let iterators = iterables.map(i => i[Symbol.iterator]() )
    while (true) {
        let results = iterators.map(iter => iter.next() )
        if (results.some(res => res.done) ) return
        else yield results.map(res => res.value )
    }
}

function intersects(set1, set2){
	for(const x of set1){
		if(set2.has(x)){
			return true;
		}
	}
	return false;
}

function parse_dictionary(csv_string){
	const arr = parse(csv_string);
	const headings = arr.shift();
	function to_obj(row){
		return Object.fromEntries(zip(headings, row));
	}
	const defns = arr.map(to_obj)
	for(const defn of defns){
		defn.areas = defn.areas.split(',').map(s => s.trim()).sort();
		if(defn.areas.length === 0){
			defn.areas = ['no especificado'];
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

function defn_html(def, language){
	const eng = divclass("english");
	const esp = divclass("spanish");
	
	eng.appendChild(divclass("word", def.ENG));
	eng.appendChild(divclass("part", '('+def.part_of_speech+')'));
	if(def.definition_ENG){
		eng.appendChild(divclass("definition", def.definition_ENG));
	}
	if(def.example_ENG){
		eng.appendChild(divclass("example", 'Example: '+def.example_ENG));
	}
	
	esp.appendChild(divclass("word", def.ESP));
	esp.appendChild(divclass("part", '('+def.part_of_speech+')'));
	if(def.definition_ESP){
		esp.appendChild(divclass("definition", def.definition_ESP));
	}
	if(def.example_ESP){
		esp.appendChild(divclass("example", 'Ejemplo: 'def.example_ESP));
	}
	
	const columns = divclass('twocol');
	const order = (language === ENGLISH) ? [eng, esp] : [esp, eng];
	for(const col of order){
		columns.appendChild(col);
	}
	
	const div = divclass("entry");
	div.appendChild(columns);
	div.appendChild(divclass("references", 'References/Referencias: '+def.sources));
	div.appendChild(divclass("subjects", "areas/áreas: "+def.areas));
	
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
				defn => defn.values.some(x => x.includes(serach_string))
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
				sec = primary_language === ENGLISH ? SPANISH : ENGLISH;
				return 1-2*(a[sec] < b[sec]);
			}
		});
		div = divclass("dictionary");
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