// 표면 종류별 샘플 이미지 매핑
const surfaceImages = {
  '2B': 'sample_2b.jpg',
  'HL': 'sample_hl.jpg',
  'Mirror': 'sample_mirror.jpg',
  'BLK_HL': 'sample_blackhl.jpg',
  'GOL_HL': 'sample_goldhl.jpg',
  'GOL_Mirror': 'sample_goldmirror.jpg',
};
//555
const typeSelect = document.getElementById('type');
const sampleImage = document.getElementById('sampleImage');
const sampleImageBox = document.querySelector('.sample-image-box');
const thicknessSelect = document.getElementById('thickness');
const quantityInput = document.getElementById('quantity');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const submitBtn = document.querySelector('.submit-btn');
const resultCard = document.getElementById('resultCard');

// 견적 리스트 누적 영역 (HTML에서 이미 정의됨)
const estimateListBox = document.getElementById('estimateListBox');

// 표면별 사용 가능한 두께 정의
const surfaceThickness = {
  'HL': ['0.8T', '1.0T', '1.2T', '1.5T', '2.0T'],
  '2B': ['0.8T', '1.0T', '1.2T', '1.5T', '2.0T'],
  'Mirror': ['1.0T', '1.2T', '1.5T', '2.0T'],
  'BLK_HL': ['1.2T'],
  'GOL_HL': ['1.2T'],
  'GOL_Mirror': ['1.2T']
};

// 두께 옵션 업데이트 함수
function updateThicknessOptions(surfaceType) {
  const thicknessSelect = document.getElementById('thickness');
  const currentThickness = thicknessSelect.value;
  const availableThickness = surfaceThickness[surfaceType] || [];
  
  // 기존 옵션 제거
  thicknessSelect.innerHTML = '<option value="">두께 선택</option>';
  
  // 새로운 옵션 추가
  availableThickness.forEach(thickness => {
    const option = document.createElement('option');
    option.value = thickness;
    option.textContent = thickness;
    thicknessSelect.appendChild(option);
  });
  
  // 기존 선택값이 새로운 옵션에 있으면 유지
  if (currentThickness && availableThickness.includes(currentThickness)) {
    thicknessSelect.value = currentThickness;
  }
}

// 표면과 두께 조합 유효성 검사
function validateSurfaceThickness(surface, thickness) {
  const availableThickness = surfaceThickness[surface] || [];
  return availableThickness.includes(thickness);
}

// 진입 시 샘플 이미지 박스와 이미지 모두 숨김
sampleImageBox.classList.add('hide');
sampleImage.classList.add('hide');

// 표면종류 선택 이벤트 리스너
typeSelect.addEventListener('change', function() {
  const selectedType = this.value;
  
  if (selectedType && selectedType !== 'a') {
    // 샘플 이미지 업데이트
    if (surfaceImages[selectedType]) {
      sampleImage.src = surfaceImages[selectedType];
      sampleImageBox.classList.remove('hide');
      sampleImage.classList.remove('hide');
    }
    
    // 두께 옵션 업데이트 (기존 선택 유지)
    updateThicknessOptions(selectedType);
  } else {
    // 샘플 이미지 숨김
    sampleImageBox.classList.add('hide');
    sampleImage.classList.add('hide');
    
    // 두께 옵션 초기화
    thicknessSelect.innerHTML = '<option value="">두께 선택</option>';
  }
});

// 팝업 관련 함수들
function showPopup() {
  const popup = document.getElementById('popup');
  popup.classList.remove('hide');
}

function closePopup() {
  const popup = document.getElementById('popup');
  popup.classList.add('hide');
}

// 최소 재단 체크 함수
function checkMinimumCutting(width, height) {
  return width < 50 || height < 50;
}

// 경동택배 착불 발송 체크 함수
function checkLargeSize(width, height) {
  // 1. 한 면이 900mm 이상인 경우
  // 2. 가로와 세로 모두 650mm를 초과하는 경우 (700*700, 800*800 등)
  return width >= 900 || height >= 900 || (width > 650 && height > 650);
}

// 경동택배 안내 표시/숨김 함수
function updateShippingNotice() {
  const shippingNotice = document.getElementById('shippingNotice');
  const guideTabDelivery = document.getElementById('guideTabDelivery');
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  
  // 이전 상태 저장
  const wasHidden = shippingNotice.classList.contains('hide');
  
  // 견적 리스트에서 경동택배 조건에 해당하는 항목이 있는지 체크
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  
  if (hasLargeSize && totalQuantity > 0) {
    shippingNotice.classList.remove('hide');
    
    // 착불 탭 빨간색 강조
    if (guideTabDelivery) {
      guideTabDelivery.style.border = '2px solid #e63946';
      guideTabDelivery.style.color = '#e63946';
    }
    
    // 착불로 변경될 때만 팝업 표시 (이전에 숨겨져 있었다면)
    if (wasHidden) {
      showDeliveryWarningPopup();
    }
  } else {
    shippingNotice.classList.add('hide');
    
    // 착불 탭 스타일 초기화
    if (guideTabDelivery) {
      guideTabDelivery.style.border = '';
      guideTabDelivery.style.color = '';
    }
  }
}

// 실제 견적 금액 산출 공식 (예시: H/L 1.2T, 300x500, 1개 = 20,800원)
function calculateEstimate() {
  const width = parseInt(widthInput.value, 10);
  const height = parseInt(heightInput.value, 10);
  const thickness = parseFloat(thicknessSelect.value);
  const quantity = parseInt(quantityInput.value, 10);
  const type = typeSelect.value;

  if (isNaN(width) || isNaN(height) || isNaN(thickness) || isNaN(quantity)) {
    return null;
  }

  // 단가 테이블 (예시)
  const unitPriceTable = {
    '2B': { '0.8': 223, '1': 271, '1.2': 317, '1.5': 388, '2': 506 },
    'HL': { '0.8': 244, '1': 295, '1.2': 346, '1.5': 420, '2': 548 },
    'Mirror': { '1': 330, '1.2': 385, '1.5': 460, '2': 598 },
    'BLK_HL': { '1.2': 500 },
    'GOL_HL': { '1.2': 627 },
    'GOL_Mirror': { '1.2': 627 },
  };

  // 면적 계산 (50mm 단위 올림)
  const calcWidth = Math.ceil(width / 50) * 50;
  const calcHeight = Math.ceil(height / 50) * 50;
  const area = (calcWidth * calcHeight) / 2500; // 2500 = 50x50

  // 단가
  let unitPrice = 0;
  if (unitPriceTable[type] && unitPriceTable[type][thickness]) {
    unitPrice = unitPriceTable[type][thickness];
  } else {
    return null;
  }

  // 판재비 (100원 단위 올림, 최소 1,000원)
  let plateCost = Math.ceil((unitPrice * area) / 100) * 100;
  if (plateCost < 1000) plateCost = 1000;

  // 재단비 (판재비 10,000원 미만이면 1,000원, 이상이면 0원)
  let cutCost = plateCost < 10000 ? 1000 : 0;

  // 총 금액
  let total = (plateCost + cutCost) * quantity;
  return {
    total,
    plateCost,
    cutCost,
    quantity,
    type,
    thickness,
    width,
    height,
    sampleImg: surfaceImages[type] || 'sample_default.jpg',
  };
}

// 결제 안내 계산 함수
function getPaymentGuide(price) {
  // 각 항목별로 1000원 단위와 100원 단위를 나눠서 계산
  let total1000 = 0;
  let total100 = 0;
  
  estimateList.forEach(item => {
    const itemTotal = item.total;
    total1000 += Math.floor(itemTotal / 1000);
    total100 += Math.floor((itemTotal % 1000) / 100);
  });
  
  return { pay1000: total1000, pay100: total100 };
}

// 포장비 계산 함수 (면적 기준)
function calculatePackagingFee() {
  // 착불 조건 확인
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  
  if (!hasLargeSize || estimateList.length === 0) {
    return 0;
  }
  
  // 제일 큰 면적 찾기
  let maxArea = 0;
  estimateList.forEach(item => {
    const area = item.width * item.height;
    if (area > maxArea) {
      maxArea = area;
    }
  });
  
  // 면적에 따른 포장비 계산
  if (maxArea <= 562500) {         // ~750×750 이하
    return 3000;
  } else if (maxArea <= 640000) {  // ~800×800
    return 5000;
  } else if (maxArea <= 720000) {  // ~900×900
    return 8000;
  } else if (maxArea <= 810000) { // ~1000×1100
    return 10000;
  } else if (maxArea <= 1100000) { // ~1200×1200
    return 12000;
  } else if (maxArea <= 1440000) { // ~1000×1600
    return 15000;
  } else {                         // > 1,600,000 (1000×1800=1,800,000 포함)
    return 20000;
  }
}

// 최종 총 금액 계산 함수 (상품 금액 + 포장비 + 면모서리가공)
function calculateFinalTotal(productTotal, totalQuantity) {
  const packagingFee = calculatePackagingFee();
  const edgeFee = totalQuantity * 500;
  return productTotal + packagingFee + edgeFee;
}

// 누적 견적 데이터 저장
let estimateList = [];

// 주문 전송 모드 상태
let orderSendMode = false;
let orderSenderName = '';

// 계산 & 추가하기 버튼 클릭 이벤트
submitBtn.addEventListener('click', function() {
  const type = typeSelect.value;
  const thickness = thicknessSelect.value;
  const quantity = parseInt(quantityInput.value);
  const width = parseInt(widthInput.value);
  const height = parseInt(heightInput.value);

  if (!type || type === 'a' || !thickness || isNaN(quantity) || isNaN(width) || isNaN(height)) {
    alert('모든 값을 입력해주세요.');
    return;
  }

  // 표면과 두께 조합 유효성 검사
  if (!validateSurfaceThickness(type, thickness)) {
    alert('선택하신 표면에서는 해당 두께를 사용할 수 없습니다.\n올바른 두께를 선택해주세요.');
    return;
  }

  // 최소 재단 체크
  if (checkMinimumCutting(width, height)) {
    showPopup();
    return;
  }

  const estimate = calculateEstimate();
  if (estimate === null) {
    alert('입력값을 확인해 주세요.');
    return;
  }

  // 견적 추가
  estimateList.push(estimate);

  // 총합 계산
  const totalSum = estimateList.reduce((acc, cur) => acc + cur.total, 0);
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  const { pay1000, pay100 } = getPaymentGuide(totalSum);

  // 경동택배 안내 업데이트
  updateShippingNotice();

  // 결과 카드 표시 (내용 없이 버튼 영역만)
  resultCard.classList.remove('hide');

  // 주문 전송 모드 총금액 업데이트
  updateOrderTotalDisplay();

  // 결제방법 UI 업데이트
  if (paymentGuideBox) {
    updatePaymentGuide();
  }

  // 결제 안내문은 더 이상 사용하지 않음 (새로운 UI로 대체)

  // 견적 리스트에 카드 추가 (샘플 이미지 없이, 정보만)
  const card = document.createElement('div');
  card.className = 'estimate-list-card';
  card.style.background = '#fff';
  card.style.borderRadius = '12px';
  card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
  card.style.padding = '18px 16px';
  card.style.marginBottom = '18px';
  card.style.display = 'flex';
  card.style.alignItems = 'center';
  card.style.gap = '18px';
  card.style.minWidth = '320px';
  card.style.maxWidth = '420px';

  // 정보
  const info = document.createElement('div');
  info.style.flex = '1';
  info.style.textAlign = 'left';
  info.innerHTML = `
    <div style="font-size:1rem;font-weight:600;">${estimate.width} × ${estimate.height} / ${estimate.quantity}개 / ${estimate.type} ${estimate.thickness}T</div>
    <div style="font-size:0.95rem;color:#4f8cff;margin:4px 0 0 0;">${estimate.total.toLocaleString()}원</div>
  `;
  card.appendChild(info);

  // X(삭제) 버튼
  const delBtn = document.createElement('button');
  delBtn.textContent = '✕';
  delBtn.style.background = 'none';
  delBtn.style.border = 'none';
  delBtn.style.fontSize = '1.3rem';
  delBtn.style.color = '#888';
  delBtn.style.cursor = 'pointer';
  delBtn.style.marginLeft = '8px';
  
  // 클로저를 사용하여 현재 estimate의 인덱스를 정확히 기억
  const currentIndex = estimateList.length - 1;
  delBtn.onclick = function() {
    // DOM에서 카드 제거
    estimateListBox.removeChild(card);
    
    // 배열에서 해당 항목 제거 (카드의 데이터 속성으로 찾기)
    const cardIndex = estimateList.findIndex(item => 
      item.width === estimate.width && 
      item.height === estimate.height && 
      item.type === estimate.type && 
      item.thickness === estimate.thickness && 
      item.quantity === estimate.quantity &&
      item.total === estimate.total
    );
    
    if (cardIndex > -1) {
      estimateList.splice(cardIndex, 1);
    }
    
    // 총 금액 재계산
    const newTotal = estimateList.reduce((acc, cur) => acc + cur.total, 0);
    const { pay1000, pay100 } = getPaymentGuide(newTotal);
    const newQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
    
    // 경동택배 안내 업데이트
    updateShippingNotice();
    
    if (newTotal === 0) {
      // 모든 항목이 삭제된 경우 결과 카드 숨기기
      resultCard.classList.add('hide');
      
      // 결제방법 안내 UI도 닫기
      if (!paymentGuideBox.classList.contains('hide')) {
        paymentGuideBox.classList.add('hide');
        paymentMethodBtn.textContent = '결제방법';
      }
      return;
    }
    
    // 주문 전송 모드 총금액 업데이트
    updateOrderTotalDisplay();
    
    // 결제방법 안내 UI가 열려있으면 업데이트
    if (!paymentGuideBox.classList.contains('hide')) {
      updatePaymentGuide();
    }
    
    // 결제 안내문은 더 이상 사용하지 않음 (새로운 UI로 대체)
  };
  card.appendChild(delBtn);

  // 리스트에 추가
  estimateListBox.appendChild(card);
});

// 최초 진입 시 결과 카드 숨김
resultCard.classList.add('hide');

// 결제방법 버튼 클릭 이벤트
const paymentMethodBtn = document.getElementById('paymentMethodBtn');
const paymentGuideBox = document.getElementById('paymentGuideBox');
const productTotalBox = document.getElementById('productTotalBox');
const productTotalAmount = document.getElementById('productTotalAmount');
const guideTabPayment = document.getElementById('guideTabPayment');
const guideTabDelivery = document.getElementById('guideTabDelivery');

// 결제방법 안내 UI 업데이트 함수
function updatePaymentGuide() {
  const guideEstimateList = document.getElementById('guideEstimateList');
  const guideOverflowNotice = document.getElementById('guideOverflowNotice');
  const guide100Qty = document.getElementById('guide100Qty');
  const guideTotalQty = document.getElementById('guideTotalQty');
  const guideTotalPrice = document.getElementById('guideTotalPrice');
  const guideEdgeBox = document.getElementById('guideEdgeBox');
  const guideEdgeQty = document.getElementById('guideEdgeQty');
  const guideEdgePrice = document.getElementById('guideEdgePrice');
  
  // 견적 리스트가 비어있으면 초기화
  if (estimateList.length === 0) {
    guideEstimateList.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">견적 항목이 없습니다.</div>';
    guideOverflowNotice.classList.add('hide');
    guide100Qty.textContent = '0';
    
    // 면모서리가공 박스 초기화
    if (guideEdgeBox) guideEdgeBox.innerHTML = '';
    if (guideEdgeQty) guideEdgeQty.textContent = '0';
    if (guideEdgePrice) guideEdgePrice.textContent = '0원';
    
    // 상품 총금액 숨김
    if (productTotalBox) productTotalBox.classList.add('hide');
    if (productTotalAmount) productTotalAmount.textContent = '0원';
    
    guideTotalQty.textContent = '총 수량 0개';
    guideTotalPrice.textContent = '0원';
    return;
  }
  
  // 견적 리스트 초기화
  guideEstimateList.innerHTML = '';
  
  // 총 금액과 수량 계산
  const totalSum = estimateList.reduce((acc, cur) => acc + cur.total, 0);
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  const { pay1000, pay100 } = getPaymentGuide(totalSum);
  
  // 5개 초과 여부 확인
  if (estimateList.length > 5) {
    guideOverflowNotice.classList.remove('hide');
  } else {
    guideOverflowNotice.classList.add('hide');
  }
  
  // 하나의 큰 입력창 생성
  const mainBoxDiv = document.createElement('div');
  mainBoxDiv.className = 'guide-estimate-main-box';
  
  // 상단 헤더
  // 공통 안내 섹션 (모드에 따라 다른 텍스트 표시)
  const instructionText = orderSendMode 
    ? '가로X세로 (mm) 에 주문자명을 입력하세요.'
    : '가로X세로 (mm) / 상품 수량(개)를 입력해주세요.';
  
  let mainHTML = `
    <div class="guide-estimate-input-box">
      <div class="guide-estimate-input-text">${instructionText}</div>
    </div>
  `;
  
  // 주문 전송 모드 체크
  if (orderSendMode) {
    // 주문 전송 모드: 전체 항목을 하나로 통합
    const totalPay1000 = Math.floor(totalSum / 1000);
    const displayName = orderSenderName || '주문자명 미입력';
    
    // 첫 번째 항목의 표면종류 가져오기
    const firstItem = estimateList.length > 0 ? estimateList[0] : null;
    const surfaceType = firstItem ? `${firstItem.type} ${firstItem.thickness}T` : '';
    
    mainHTML += `
      <div class="guide-estimate-row">
        <div class="estimate-info-line">
          <span class="estimate-info-text">${displayName} / 셀프견적 / ${surfaceType}</span>
        </div>
        <div class="estimate-payment-line">
          <div class="payment-qty-box">
            <button class="qty-btn">-</button>
            <span class="qty-value">${totalPay1000}</span>
            <button class="qty-btn">+</button>
          </div>
          <span class="estimate-total-price">${(totalPay1000 * 1000).toLocaleString()}원</span>
        </div>
      </div>
    `;
  } else {
    // 기존 방식: 각 항목별로 표시
    const displayList = estimateList.slice(0, 5);
    displayList.forEach((item, index) => {
      // 각 항목의 금액을 1,000원 단위로 분해
      const itemPay1000 = Math.floor(item.total / 1000);
      
      // 견적 정보와 1,000원 단위를 한 행에 표시
      mainHTML += `
        <div class="guide-estimate-row">
          <div class="estimate-info-line">
            <span class="estimate-info-text">${item.width}*${item.height} / ${item.quantity}개 / 셀프견적 / ${item.type} ${item.thickness}T</span>
          </div>
          <div class="estimate-payment-line">
            <div class="payment-qty-box">
              <button class="qty-btn">-</button>
              <span class="qty-value">${itemPay1000}</span>
              <button class="qty-btn">+</button>
            </div>
            <span class="estimate-total-price">${(itemPay1000 * 1000).toLocaleString()}원</span>
          </div>
        </div>
      `;
    });
  }
  
  mainBoxDiv.innerHTML = mainHTML;
  guideEstimateList.appendChild(mainBoxDiv);
  
  // 100원 단위 전체 합계 (있을 경우만)
  if (pay100 > 0) {
    const hundredBoxDiv = document.createElement('div');
    hundredBoxDiv.className = 'guide-estimate-main-box';
    hundredBoxDiv.innerHTML = `
      <div class="edge-optional-header">추가상품 선택</div>
      <div class="guide-estimate-row">
        <div class="estimate-info-line">
          <span class="estimate-info-text">100원 단위 금액 추가</span>
        </div>
        <div class="estimate-payment-line">
          <div class="payment-qty-box">
            <button class="qty-btn">-</button>
            <span class="qty-value">${pay100}</span>
            <button class="qty-btn">+</button>
          </div>
          <span class="estimate-total-price">${(pay100 * 100).toLocaleString()}원</span>
        </div>
      </div>
    `;
    guideEstimateList.appendChild(hundredBoxDiv);
  }
  
  // 포장비 추가 (착불일 때만)
  const packagingFee = calculatePackagingFee();
  if (packagingFee > 0) {
    const packagingBoxDiv = document.createElement('div');
    packagingBoxDiv.className = 'guide-estimate-main-box';
    packagingBoxDiv.innerHTML = `
      <div class="edge-optional-header">추가상품 선택</div>
      <div class="guide-estimate-row">
        <div class="estimate-info-line">
          <span class="estimate-info-text">포장비 (착불)</span>
        </div>
        <div class="estimate-payment-line">
          <div class="payment-qty-box">
            <button class="qty-btn">-</button>
            <span class="qty-value">1</span>
            <button class="qty-btn">+</button>
          </div>
          <span class="estimate-total-price">${packagingFee.toLocaleString()}원</span>
        </div>
      </div>
    `;
    guideEstimateList.appendChild(packagingBoxDiv);
  }
  
  // 면모서리가공 박스 생성
  const edgeTotalPrice = totalQuantity * 500;
  
  const edgeBoxDiv = document.createElement('div');
  edgeBoxDiv.className = 'guide-estimate-main-box';
  edgeBoxDiv.style.position = 'relative';
  edgeBoxDiv.innerHTML = `
    <div class="edge-optional-header">추가상품 선택</div>
    <div class="optional-stamp">선택 사항</div>
    <div class="guide-estimate-row">
      <div class="estimate-info-line">
        <span class="estimate-info-text">면모서리가공 1장</span>
      </div>
      <div class="estimate-payment-line">
        <div class="payment-qty-box">
          <button class="qty-btn">-</button>
          <span class="qty-value">${totalQuantity}</span>
          <button class="qty-btn">+</button>
        </div>
        <span class="estimate-total-price">${edgeTotalPrice.toLocaleString()}원</span>
      </div>
    </div>
  `;
  
  if (guideEdgeBox) {
    guideEdgeBox.innerHTML = '';
    guideEdgeBox.appendChild(edgeBoxDiv);
  }
  
  // 수량 정보 업데이트 (숨겨진 요소)
  guide100Qty.textContent = pay100;
  if (guideEdgeQty) guideEdgeQty.textContent = totalQuantity;
  if (guideEdgePrice) guideEdgePrice.textContent = edgeTotalPrice.toLocaleString() + '원';
  
  // 상품 총금액 표시 업데이트 (추가상품 제외)
  if (productTotalAmount) {
    productTotalAmount.textContent = totalSum.toLocaleString() + '원';
  }
  if (productTotalBox) {
    productTotalBox.classList.remove('hide');
  }
  
  // 최종 총 금액 계산 (별도 함수 사용)
  const finalTotal = calculateFinalTotal(totalSum, totalQuantity);
  
  guideTotalQty.textContent = `총 수량 ${totalQuantity}개`;
  guideTotalPrice.textContent = finalTotal.toLocaleString() + '원';
  
  // 경동택배 조건 확인 (견적 리스트에서)
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  
  // 탭 활성화 상태 업데이트
  if (hasLargeSize && estimateList.length > 0) {
    // 착불 조건 충족 시 착불 탭 활성화 (빨간색)
    guideTabPayment.classList.remove('active');
    guideTabDelivery.classList.remove('active');
    guideTabDelivery.classList.add('delivery-active');
  } else {
    // 기본 주문시 결제 탭 활성화
    guideTabDelivery.classList.remove('delivery-active');
    guideTabDelivery.classList.remove('active');
    guideTabPayment.classList.add('active');
  }
}

if (paymentMethodBtn && paymentGuideBox) {
  paymentMethodBtn.addEventListener('click', function() {
    // 결제방법 안내 박스 토글
    if (paymentGuideBox.classList.contains('hide')) {
      // 견적 리스트가 비어있으면 경고
      if (estimateList.length === 0) {
        alert('먼저 견적을 계산하고 추가해주세요.');
        return;
      }
      
      // 결제방법 안내 UI 업데이트
      updatePaymentGuide();
      
      paymentGuideBox.classList.remove('hide');
      paymentMethodBtn.textContent = '결제방법 닫기';
    } else {
      paymentGuideBox.classList.add('hide');
      paymentMethodBtn.textContent = '결제방법';
    }
  });
}

// 주문 전송 방식 관련 이벤트
const orderSendModeCheckbox = document.getElementById('orderSendModeCheckbox');
const orderNameSection = document.getElementById('orderNameSection');
const orderNameInput = document.getElementById('orderNameInput');
const orderNameApplyBtn = document.getElementById('orderNameApplyBtn');

// 체크박스 토글
if (orderSendModeCheckbox) {
  orderSendModeCheckbox.addEventListener('change', function() {
    const orderSendModeBadge = document.getElementById('orderSendModeBadge');
    
    if (this.checked) {
      orderNameSection.classList.remove('hide');
      orderSendMode = true;
      
      // 간편 주문 전송 뱃지 표시
      if (orderSendModeBadge) {
        orderSendModeBadge.classList.remove('hide');
      }
      
      // 주문 전송 버튼 표시
      const orderSendBtn = document.getElementById('orderSendBtn');
      if (orderSendBtn) {
        orderSendBtn.classList.remove('hide');
      }
      
      // 총금액 표시
      updateOrderTotalDisplay();
    } else {
      orderNameSection.classList.add('hide');
      orderSendMode = false;
      orderSenderName = '';
      orderNameInput.value = '';
      
      // 간편 주문 전송 뱃지 숨김
      if (orderSendModeBadge) {
        orderSendModeBadge.classList.add('hide');
      }
      
      // 주문 전송 버튼 숨김
      const orderSendBtn = document.getElementById('orderSendBtn');
      if (orderSendBtn) {
        orderSendBtn.classList.add('hide');
      }
      
      // 총금액 표시 숨김
      const orderTotalDisplay = document.getElementById('orderTotalDisplay');
      if (orderTotalDisplay) {
        orderTotalDisplay.classList.add('hide');
      }
    }
    
    // 결제방법 UI 업데이트
    if (paymentGuideBox) {
      updatePaymentGuide();
    }
  });
}

// 총금액 표시 업데이트 함수 (더 이상 사용하지 않음)
function updateOrderTotalDisplay() {
  // 중복 표시 제거로 인해 빈 함수로 유지
}

// 주문자명 적용 버튼
if (orderNameApplyBtn) {
  orderNameApplyBtn.addEventListener('click', function() {
    const name = orderNameInput.value.trim();
    if (!name) {
      alert('주문자명을 입력해주세요.');
      return;
    }
    
    orderSenderName = name;
    
    // 커스텀 팝업 표시
    showCustomPopup('위 내용으로 결제 후 주문 내역 전송을 해주세요<br><span style="font-size: 0.95rem; opacity: 0.95; margin-top: 8px; display: inline-block;">(오전송 방지)</span>', 5000);
    
    // 결제방법 UI 업데이트
    if (paymentGuideBox) {
      updatePaymentGuide();
    }
  });
}

// 주문 전송 버튼 클릭 이벤트
const orderSendBtn = document.getElementById('orderSendBtn');
if (orderSendBtn) {
  orderSendBtn.addEventListener('click', async function() {
    if (!orderSendMode) {
      alert('간편 주문 전송을 먼저 활성화해주세요.');
      return;
    }
    
    if (estimateList.length === 0) {
      alert('견적 항목이 없습니다.');
      return;
    }
    
    if (!orderSenderName) {
      // 주문자명 입력 섹션 강조 애니메이션
      const orderNameSection = document.getElementById('orderNameSection');
      if (orderNameSection) {
        orderNameSection.classList.add('highlight-shake');
        setTimeout(() => {
          orderNameSection.classList.remove('highlight-shake');
        }, 2100);
      }
      alert('주문자명을 먼저 입력해주세요!');
      return;
    }
    
    // 전송 전 확인
    const confirmSend = confirm('주문 내역을 전송하시겠습니까?');
    if (!confirmSend) {
      return;
    }
    
    // 버튼 비활성화 (중복 전송 방지)
    orderSendBtn.disabled = true;
    orderSendBtn.textContent = '📤 전송 중...';
    orderSendBtn.style.opacity = '0.6';
    orderSendBtn.style.cursor = 'not-allowed';
    
    // 총 금액과 수량 계산
    const totalSum = estimateList.reduce((acc, cur) => acc + cur.total, 0);
    const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
    const { pay1000, pay100 } = getPaymentGuide(totalSum);
    const edgeTotalPrice = totalQuantity * 500;
    const packagingFee = calculatePackagingFee();
    
    const orderData = {
      senderName: orderSenderName,
      items: estimateList,
      totalAmount: totalSum,
      edgeQuantity: totalQuantity,
      edgePrice: edgeTotalPrice,
      pay100: pay100,
      packagingFee: packagingFee
    };
    
    // Discord로 전송
    const success = await sendToDiscord(orderData);
    
    // 버튼 원상복구
    orderSendBtn.disabled = false;
    orderSendBtn.textContent = '📦 주문 내역 전송';
    orderSendBtn.style.opacity = '1';
    orderSendBtn.style.cursor = 'pointer';
  });
}

// 커스텀 팝업 표시 함수
function showCustomPopup(message, duration = 3000) {
  // 기존 팝업이 있으면 제거
  const existingPopup = document.querySelector('.custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // 팝업 생성
  const popup = document.createElement('div');
  popup.className = 'custom-popup';
  popup.innerHTML = `
    <div class="custom-popup-content">
      <div class="custom-popup-icon">✓</div>
      <div class="custom-popup-message">${message}</div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // 애니메이션을 위한 약간의 딜레이
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  // 지정된 시간 후 제거
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, duration);
}

// 착불 경고 팝업 표시 함수
function showDeliveryWarningPopup() {
  // 기존 팝업이 있으면 제거
  const existingPopup = document.querySelector('.custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // 팝업 생성
  const popup = document.createElement('div');
  popup.className = 'custom-popup';
  popup.innerHTML = `
    <div class="custom-popup-content delivery-warning">
      <div class="custom-popup-message">
        <div class="delivery-warning-line1">⚠️ 경동택배 착불 발송 부피 및 무게 초과</div>
        <div class="delivery-warning-line2">결제시 착불 선택</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // 애니메이션을 위한 약간의 딜레이
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  // 3초 후 제거
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 3000);
}

// Discord webhook 전송 함수
async function sendToDiscord(orderData) {
  const webhookUrl = 'https://discord.com/api/webhooks/1424757958914609215/p0mTKGPxhAMZ60vzOHTs5iJ6M4rh4UYAVRMeVIEiI9YxVdUdV6H0I3PezTp7SmNpr0Z_';
  
  // 현재 시각
  const now = new Date();
  const timeStr = now.toLocaleString('ko-KR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  }).replace(/\. /g, '.').replace(/\.$/, '');
  
  // 견적 항목 정리
  let itemsText = '';
  orderData.items.forEach((item, index) => {
    const num = index + 1;
    itemsText += `${num}️⃣ ${item.width}×${item.height} / ${item.quantity}개 / ${item.type} ${item.thickness}T → 💰 ${item.total.toLocaleString()}원\n`;
  });
  
  // 포장비 텍스트 (있을 경우만)
  const packagingText = orderData.packagingFee > 0 
    ? `📦 **포장비 (착불):** ${orderData.packagingFee.toLocaleString()}원\n` 
    : '';
  
  // Discord 메시지 포맷
  const messageContent = `📦 **새로운 주문이 접수되었습니다**

👤 **주문자:** ${orderData.senderName}
🕓 **주문 시각:** ${timeStr}

🧾 **주문 내역**
────────────────────────
${itemsText}────────────────────────
🧩 **면모서리 가공:** ${orderData.edgeQuantity}개 (+${orderData.edgePrice.toLocaleString()}원)
${packagingText}🔹 **100원 단위 견적 수:** ${orderData.pay100}개

💵 **총 결제 금액:** **${orderData.totalAmount.toLocaleString()}원**

** 결제 내역 확인 필요 **
 
** ================================== **
** ================================== **`;
  
  const payload = {
    content: messageContent
  };
  
  console.log('Discord 전송 시도:', payload);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Discord 응답 상태:', response.status);
    
    if (response.ok || response.status === 204) {
      alert('주문이 성공적으로 전송되었습니다!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('Discord 오류 응답:', errorText);
      alert('주문 전송 중 오류가 발생했습니다.');
      return false;
    }
  } catch (error) {
    console.error('Discord 전송 오류:', error);
    alert('주문 전송 중 네트워크 오류가 발생했습니다: ' + error.message);
    return false;
  }
}

// 페이지 로드 시 결제방법 UI 초기화
window.addEventListener('DOMContentLoaded', function() {
  updatePaymentGuide();
});