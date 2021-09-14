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
};