import { getScalingFactor } from "./mobAttackTool.js";
export function getMultiattackFromActor(weaponName, actorData, weapons) {

	let dictStrNum = {	"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10};
	let multiattack = [1, false];
	if (actorData.items.entries.filter(i => i.name.startsWith("Multiattack")).length > 0) {

		// Check for eldritch blast
		let weaponData = actorData.items.getName(weaponName);
		if (weaponData.type === "spell") {
			if (weaponName === "Eldritch Blast") {
				multiattack = [getScalingFactor(weaponData), false];
			}
		}

		// Remove paragraph end html tag from description text
		let desc = actorData.items.entries.filter(i => i.name.startsWith("Multiattack"))[0].data.data.description.value;
		if (desc.endsWith(".</p>")) {
			desc = desc.slice(0,-5);
		}

		// First split multiattack description in general and specific parts
		let attackIndex = desc.indexOf(`attack`);
		let attackType = ``;
		if (desc.indexOf(`melee attacks`) !== -1) {
			attackIndex = desc.indexOf(`melee attacks`);
			if (desc.indexOf(`ranged attacks`) !== -1) {
				attackType = `choose`;
			} else {
				attackType = `melee`;	
			}
		} else if (desc.indexOf(`ranged attacks`) !== -1) {
			attackIndex = desc.indexOf(`ranged attacks`);
			attackType = `ranged`;
		} else if (desc.indexOf(`${weaponName.toLowerCase()} attacks`) !== -1 || desc.indexOf(`${weaponName.toLowerCase()}s attacks`) !== -1) {
			attackIndex = desc.indexOf(`${weaponName.toLowerCase()} attacks`);
			attackType = `specific`;
		}

		// Split up description into words for analysis
		let initialWords = desc.slice(0,attackIndex).split(" ");

		// Then detect overall number of multiattack attacks
		let numAttacksTotal = 0;
		let numAttacksWeapon = 0;
		for (let word of initialWords) {
			if (dictStrNum[word]) {
				if (attackType !== ``) {
					numAttacksWeapon = dictStrNum[word];
				} 
				numAttacksTotal = dictStrNum[word];
				break;
			}
		}

		// Next detect specific number of attacks of this weapon
		// (This is the complicated / messy part.)
		let remainingWords = desc.slice(attackIndex + attackType.length + 8).split(" ").reverse();
		
		if (remainingWords.length < 3) {
			if (attackType === `melee`) {
				if (![`mwak`, `msak`].includes(weaponData.data.data.actionType)) {
					attackType = `choose`;
				}
			} else if (attackType === `ranged`) {
				if (![`rwak`, `rsak`].includes(weaponData.data.data.actionType)) {
					attackType = `choose`;
				}
			}
			console.log(weaponName, attackType);
		}

		let weaponDetected = false;
		let twiceAtEnd = false;

		// Step backwards through multiattack description
		for (let word of remainingWords) {

			
			
			// homogenize words to simplify detection
			word = word.toLowerCase();
			let interpunction = [",",".",":"];
			for (let ip of interpunction) {
				if (word.endsWith(ip)) word = word.slice(0,word.indexOf(ip));	
			}
			
			// check if description ends with 'twice' (a rare exception)
			if (word === "twice") {
				twiceAtEnd = true;
			}

			// detect weapon
			if (weaponName.toLowerCase().split(" ").includes(word) || `${weaponName.toLowerCase()}s`.split(" ").includes(word)) {	
				weaponDetected = true;
			}
			
			// detect possibility of choosing what kind of multiattack to use
			const optionKeywordsSingle = [`or`,`alternatively`,` instead`];
			if (weaponDetected) {
				if (optionKeywordsSingle.includes(word)) {
					attackType = `choose`;
					if (twiceAtEnd) {
						numAttacksWeapon = 2;
						break;
					}
				}
			}

			// match text number to actual value for number of attacks	
			if (weaponDetected && dictStrNum[word]) {
				numAttacksWeapon = dictStrNum[word];
				break;
			}
		}


		let typeArray = [];
		let numWeaponsInventory = actorData.items.filter(w => w.data.type === "weapon").length
		if (attackType !== ``) {
			if (attackType === `melee`) {
				typeArray = [`simpleM`, `martialM`];
			} else if (attackType === `ranged`) {
				typeArray = [`simpleR`, `martialR`];
			}
			numWeaponsInventory = actorData.items.filter(w => typeArray.includes(w.data.data.weaponType)).length;
		}

		// either return the specific or total number of multiattacks 
		if (numAttacksTotal !== 0) {
			if (numAttacksWeapon !== 0) {
				multiattack = [(numWeaponsInventory === numAttacksWeapon) ? 1 : numAttacksWeapon, (attackType !== `choose`) ? true : false];
			} else if (weaponDetected) {
				multiattack = [(numWeaponsInventory === numAttacksTotal) ? 1 : numAttacksTotal, (attackType !== `choose`) ? true : false];
			}
		}

	// for actors with the Extra Attack item
	} else if (actorData.items.getName("Extra Attack") !== null) {
		let weaponData = actorData.items.getName(weaponName);
		if (weaponData.type === "spell") {
			if (weaponName === "Eldritch Blast") {
				multiattack = [getScalingFactor(weaponData), false];
			}
		} else {
			multiattack = [2, false];	
		}

	// for fighters
	} else if (actorData.items.getName("Extra Attack (Fighter)") !== null) {
		let weaponData = actorData.items.getName(weaponName);
		if (weaponData.type === "spell") {
			if (weaponName === "Eldritch Blast") {
				multiattack = [getScalingFactor(weaponData), false];
			}	
		} else {
			let actorLevel = actorData.data.data.details.level;
			if (actorLevel < 11) {
				multiattack = [2, false];
			} else if (11 <= actorLevel && actorLevel < 20) {
				multiattack = [3, false];
			} else if (actorLevel === 20) {
				multiattack = [4, false];
			}
		}

	// for actors without multiattack
	} else {
		let weaponData = actorData.items.getName(weaponName);
		if (weaponData.type === "spell") {
			if (weaponName === "Eldritch Blast") {
				multiattack = [getScalingFactor(weaponData), false];
			}	
		}
	};
	return multiattack;
}