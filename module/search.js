function removeNonKoreanChars(str) {
	const regex = /[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/gi;
	return str.replace(regex, '');
}

function getschoolName(str) {
	const suffixes = {
		'유치원': ['유치원'],
		'초등학교': ['초', '초등', '초등학', '초등학교'],
		'중학교': ['중', '중학', '중학교'],
		'고등학교': ['고', '고등', '고등학', '고등학교']
	};
	let schoolName_rm = '';
	
	for (let suffix in suffixes) {
		let patterns = suffixes[suffix];
		for (let pattern of patterns) {
			if (str.endsWith(pattern)) {
				schoolName_rm = str.slice(0, str.length - pattern.length) + suffix;
				break;
			}
		}
		if (schoolName_rm !== '') break;
	}
	if (schoolName_rm == '') {
		return str;
	} else {
		return schoolName_rm;
	}
}

function automaticCompletion(schoolName, schoolType) {
	const trimmedName = getschoolName(schoolName)
	switch(schoolType) {
		case 'KINDERGARTEN': 
			if(schoolName.includes("유치원")) {
				break;
			}
			if(trimmedName == schoolName) {
				schoolName += "유치원"
			} else {
				schoolName = trimmedName
			}
			break;
		case 'ELEMENTARY':
			if(schoolName.includes("초등학교")) {
				break;
			}
			if(trimmedName == schoolName) {
				schoolName += "초등학교"
			} else {
				schoolName = trimmedName
			}
			break;
		case 'MIDDLE':
			if(schoolName.includes("중학교")) {
				break;
			}
			if(trimmedName == schoolName) {
				schoolName += "중학교"
			} else {
				schoolName = trimmedName
			}
			break;
		case 'HIGH':
			if(schoolName.includes("고등학교")) {
				break;
			}
			if(trimmedName == schoolName) {
				schoolName += "고등학교"
			} else {
				schoolName = trimmedName
			}
			break;
	}
	return schoolName
}

window.onload = function() {
	const searchBtn = document.getElementById('search-btn');
	const searchInput = document.getElementById('search-input');

	searchBtn.addEventListener('click', function() {
		search();
	});
	searchInput.addEventListener('keypress', function(event) {
		if (event.key === 'Enter') {
			search();
		}
	});
}

function search() {
	let schoolName = document.querySelector('.search input').value;
	const schoolTypeSelect = document.getElementById("school-type");
	const locationSelect = document.getElementById("location");
	const checkbox = document.querySelector('input[name="automatic"]');
		
	const containsNonKorean = str => /[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(str);
		
	if (containsNonKorean(schoolName)) {
		schoolName = removeNonKoreanChars(schoolName);
	}
		
	if (schoolTypeSelect.selectedIndex === 0 || locationSelect.selectedIndex === 0) {
		alert("검색 조건을 선택해 주세요.");
		return;
	}
		
	if (schoolName.length <= 1) {
		alert("두글자 이상 입력해 주세요");
		return;
	}
		
	const schoolType = schoolTypeSelect.options[schoolTypeSelect.selectedIndex].value;
	const location = locationSelect.options[locationSelect.selectedIndex].value;
		
	if (checkbox.checked) {
		schoolName = automaticCompletion(schoolName, schoolType);
	}
		
	fetch('/search', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ schoolType, location, schoolName: schoolName }),
	})
	.then(res => {
		if (res.ok) {
			return res.json();
		} else {
			throw new Error("검색 요청이 실패하였습니다.");
		}
	})
	.then(data => {
		if (data.length <= 10) {
			showSearchResults(data, schoolType, location, schoolName);
		} else {
			alert("더 정확하게 입력해 주세요");
		}
	})
	.catch(error => {
		console.error(error);
		// 적절한 오류 메시지를 사용자에게 보여준다.
	});
}

function showSearchResults(data, schoolType, location, schoolName) {
	const outputDiv = document.querySelector('#output');
	outputDiv.innerHTML = `${schoolName}의 검색 결과는 총 ${data.length}개 입니다.`;
	
	const tablesDiv = document.getElementById("tables");
	tablesDiv.innerHTML = "";
	
	data.forEach((object) => {
		const table = document.createElement("table");
		table.className = "type03";
		Object.entries(object).forEach(([key, value]) => {
			const tr = document.createElement("tr");
			const th = document.createElement("th");
			th.textContent = key;
			tr.appendChild(th);
			const td = document.createElement("td");
			if (key === "name" || key === "address") {
				const link = document.createElement("a");
				link.textContent = value;
				if (key === "name") {
					link.href = `/html/index.html`;
					link.addEventListener("click", function(event) {
						event.preventDefault();
						schoolName = event.target.textContent;
						fetch('/Calendar', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({ schoolType, location, schoolName }),
						})
						.then(res => {
							if (res.ok) {
								window.location.href = `/html-Calendar`;
							} else {
								throw new Error("Calendar fetch failed");
							}
						})
						.catch(error => {
							console.error(error);
							alert(error.message);
						});
					});
				} else  {
					link.href = `https://m.map.naver.com/search2/search.naver?query=${encodeURI(value)}&sm=shistory&style=v5`;
				}
				link.target = "_self";
				td.appendChild(link);
			} else {
				td.textContent = value;
			}
			tr.appendChild(td);
			table.appendChild(tr);
		});
		tablesDiv.appendChild(table);
	});
}