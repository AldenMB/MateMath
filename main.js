import {makeDictionary, ENGLISH, SPANISH} from './modules/dictionary.js';

window.onload = function() {
	const sortbutton = document.getElementById('sort');
	function get_primary_language(){
		return (
			(sortbutton.innerText === 'Mate ↔ Math') 
			?
			SPANISH
			:
			ENGLISH
		);
	};
	
	sortbutton.onclick = function(){
		const english_first = get_primary_language() === SPANISH;
		sortbutton.innerText = english_first ? 'Math ↔ Mate' : 'Mate ↔ Math';
		for(let div of document.getElementsByClassName('twocol')){
			const eng = div.querySelector('.english');
			if((div.children[0] === eng) !== english_first){
				//swap 'em
				const second = div.children[1];
				div.removeChild(second);
				div.insertBefore(second, div.children[0]);
			}
		}
	};
	
	fetch('./dictionary.csv')
		.then((response) => {
			return response.text();
		})
		.then((data) => {
			const areas_container = document.getElementById("subject areas");
			const area_boxes = [];
			function get_subject_areas(){
				return area_boxes.filter(x => !x.checked).map(x => x.name);
			};
			function get_search_text(){
				return document.getElementById("search").value;
			};
			
			const dictionary = makeDictionary(
				data,
				document.getElementById("dictionary"),
				get_primary_language,
				get_subject_areas,
				get_search_text
			);
			
			for(const a of dictionary.areas){
				const box = document.createElement("input");
				box.setAttribute("type", "checkbox");
				box.setAttribute("id", a);
				box.setAttribute("name", a);
				box.checked = true;
				areas_container.appendChild(box);
				area_boxes.push(box);
				const label = document.createElement("label");
				label.setAttribute("for", a);
				label.appendChild(document.createTextNode(a));
				areas_container.appendChild(label);
			}
			dictionary.filter();
			
			document.getElementById("selections").addEventListener('input', dictionary.filter);
			
			document.getElementById("search").addEventListener('input', dictionary.search);
			
			document.getElementById("sort").addEventListener('click', dictionary.sort);
			
			MathJax.typeset();
		});
};