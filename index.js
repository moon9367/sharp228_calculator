const surfaceImages = {
  '2B': 'sample_2b.jpg',
  'HL': 'sample_hl.jpg',
  'Mirror': 'sample_mirror.jpg',
  'BLK_HL': 'sample_blackhl.jpg',
  'GOL_HL': 'sample_goldhl.jpg',
  'GOL_Mirror': 'sample_goldmirror.jpg',
};

const typeSelect = document.getElementById('type');
const sampleImage = document.getElementById('sampleImage');
const sampleImageBox = document.querySelector('.sample-image-box');
const thicknessSelect = document.getElementById('thickness');
const quantityInput = document.getElementById('quantity');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const submitBtn = document.querySelector('.submit-btn');
const resultCard = document.getElementById('resultCard');

const estimateListBox = document.getElementById('estimateListBox');

const surfaceThickness = {
  'HL': ['0.8T', '1.0T', '1.2T', '1.5T', '2.0T'],
  '2B': ['0.8T', '1.0T', '1.2T', '1.5T', '2.0T'],
  'Mirror': ['1.0T', '1.2T', '1.5T', '2.0T'],
  'BLK_HL': ['1.2T'],
  'GOL_HL': ['1.2T'],
  'GOL_Mirror': ['1.2T']
};

function updateThicknessOptions(surfaceType) {
  const thicknessSelect = document.getElementById('thickness');
  const currentThickness = thicknessSelect.value;
  const availableThickness = surfaceThickness[surfaceType] || [];
  
  thicknessSelect.innerHTML = '<option value="">두께 선택</option>';
  
  availableThickness.forEach(thickness => {
    const option = document.createElement('option');
    option.value = thickness;
    option.textContent = thickness;
    thicknessSelect.appendChild(option);
  });
  
  if (currentThickness && availableThickness.includes(currentThickness)) {
    thicknessSelect.value = currentThickness;
  }
}

function validateSurfaceThickness(surface, thickness) {
  const availableThickness = surfaceThickness[surface] || [];
  return availableThickness.includes(thickness);
}

sampleImageBox.classList.add('hide');
sampleImage.classList.add('hide');

typeSelect.addEventListener('change', function() {
  const selectedType = this.value;
  
  if (selectedType && selectedType !== 'a') {
    if (surfaceImages[selectedType]) {
      sampleImage.src = surfaceImages[selectedType];
      sampleImageBox.classList.remove('hide');
      sampleImage.classList.remove('hide');
    }
    
    updateThicknessOptions(selectedType);
  } else {
    sampleImageBox.classList.add('hide');
    sampleImage.classList.add('hide');
    
    thicknessSelect.innerHTML = '<option value="">두께 선택</option>';
  }
});

function showPopup() {
  const popup = document.getElementById('popup');
  popup.classList.remove('hide');
}

function closePopup() {
  const popup = document.getElementById('popup');
  popup.classList.add('hide');
}

function checkMinimumCutting(width, height) {
  return width < 50 || height < 50;
}

function checkLargeSize(width, height) {
  return width >= 900 || height >= 900 || (width > 650 && height > 650);
}

function updateShippingNotice() {
  const shippingNotice = document.getElementById('shippingNotice');
  const guideTabDelivery = document.getElementById('guideTabDelivery');
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  
  const wasHidden = shippingNotice.classList.contains('hide');
  
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  
  if (hasLargeSize && totalQuantity > 0) {
    shippingNotice.classList.remove('hide');
    
    if (guideTabDelivery) {
      guideTabDelivery.style.border = '2px solid #e63946';
      guideTabDelivery.style.color = '#e63946';
    }
    
    if (wasHidden) {
      showDeliveryWarningPopup();
    }
  } else {
    shippingNotice.classList.add('hide');
    
    if (guideTabDelivery) {
      guideTabDelivery.style.border = '';
      guideTabDelivery.style.color = '';
    }
  }
}

function calculateEstimate() {
  const width = parseInt(widthInput.value, 10);
  const height = parseInt(heightInput.value, 10);
  const thickness = parseFloat(thicknessSelect.value);
  const quantity = parseInt(quantityInput.value, 10);
  const type = typeSelect.value;

  if (isNaN(width) || isNaN(height) || isNaN(thickness) || isNaN(quantity)) {
    return null;
  }

  const unitPriceTable = {
    '2B': { '0.8': 223, '1': 271, '1.2': 317, '1.5': 388, '2': 506 },
    'HL': { '0.8': 244, '1': 295, '1.2': 346, '1.5': 420, '2': 548 },
    'Mirror': { '1': 330, '1.2': 385, '1.5': 460, '2': 598 },
    'BLK_HL': { '1.2': 500 },
    'GOL_HL': { '1.2': 627 },
    'GOL_Mirror': { '1.2': 627 },
  };

  const calcWidth = Math.ceil(width / 50) * 50;
  const calcHeight = Math.ceil(height / 50) * 50;
  const area = (calcWidth * calcHeight) / 2500;

  let unitPrice = 0;
  if (unitPriceTable[type] && unitPriceTable[type][thickness]) {
    unitPrice = unitPriceTable[type][thickness];
  } else {
    return null;
  }

  let plateCost = Math.ceil((unitPrice * area) / 100) * 100;
  if (plateCost < 1000) plateCost = 1000;

  let cutCost = plateCost < 10000 ? 1000 : 0;

  let baseTotal = (plateCost + cutCost) * quantity;
  
  const actualArea = width * height;
  
  return {
    total: baseTotal,
    baseTotal: baseTotal,
    plateCost,
    cutCost,
    quantity,
    type,
    thickness,
    width,
    height,
    area: actualArea,
    discount: null,
    sampleImg: surfaceImages[type] || 'sample_default.jpg',
  };
}

function applyRounding(price) {
  if (price <= 10000) {
    return Math.floor(price / 100) * 100;
  } else {
    return Math.round(price / 1000) * 1000;
  }
}

function recalculateAllDiscounts() {
  if (estimateList.length === 0) {
    return;
  }
  
  const totalArea = estimateList.reduce((acc, item) => acc + (item.area * item.quantity), 0);
  const totalQuantity = estimateList.reduce((acc, item) => acc + item.quantity, 0);
  const totalBasePrice = estimateList.reduce((acc, item) => acc + item.baseTotal, 0);
  
  // 각 항목을 개별적으로 처리
  estimateList.forEach(item => {
    const is08T = item.thickness === 0.8;
    let discountType = 'none';
    let discountRate = 0;
    
    // 면적 할인 체크
    if (is08T) {
      // 0.8T: 1,500,000 mm² 이상일 때만 5% 할인
      if (totalArea >= 1500000) {
        discountType = 'delivery';
        discountRate = 5;
      }
    } else {
      // 다른 두께: 기존 면적 할인율
      if (totalArea >= 1500000) {
        discountType = 'delivery';
        discountRate = 13;
      } else if (totalArea >= 1200000) {
        discountType = 'delivery';
        discountRate = 10;
      } else if (totalArea >= 1000000) {
        discountType = 'delivery';
        discountRate = 5;
      }
    }
    
    // 수량 할인 체크 (면적 할인이 없을 때만)
    if (discountType === 'none' && totalBasePrice >= 50000) {
      if (is08T) {
        // 0.8T: 26개 이상일 때 5% 할인
        if (totalQuantity >= 26) {
          discountType = 'prepay';
          discountRate = 5;
        }
      } else {
        // 다른 두께: 10개 이상부터 기존 할인율
        if (totalQuantity >= 75) {
          discountType = 'prepay';
          discountRate = 13;
        } else if (totalQuantity >= 26) {
          discountType = 'prepay';
          discountRate = 10;
        } else if (totalQuantity >= 10) {
          discountType = 'prepay';
          discountRate = 5;
        }
      }
    }
    
    // 할인 적용
    if (discountType !== 'none') {
      let discountedPrice;
      
      // 0.8T는 항상 정확한 비율 할인
      if (is08T) {
        discountedPrice = item.baseTotal * (1 - discountRate / 100);
      }
      // 다른 두께는 delivery일 때 특수 공식, 아니면 비율 할인
      else if (discountType === 'delivery') {
        discountedPrice = (item.baseTotal / 3) * 2.6;
      } else {
        discountedPrice = item.baseTotal * (1 - discountRate / 100);
      }
      
      const finalPrice = applyRounding(discountedPrice);
      
      item.discount = {
        type: discountType,
        rate: discountRate,
        basePrice: item.baseTotal,
        finalPrice: finalPrice,
        discountAmount: item.baseTotal - finalPrice,
        hasDiscount: true
      };
      item.total = finalPrice;
    } else {
      item.discount = null;
      item.total = applyRounding(item.baseTotal);
    }
  });
}

function calculateDiscount(basePrice, quantity, area) {
  return {
    type: 'none',
    rate: 0,
    basePrice: basePrice,
    finalPrice: basePrice,
    discountAmount: 0,
    hasDiscount: false
  };
}

function getPaymentGuide(price) {
  let total1000 = 0;
  let total100 = 0;
  
  estimateList.forEach(item => {
    const itemTotal = item.total;
    total1000 += Math.floor(itemTotal / 1000);
    
    if (itemTotal < 10000) {
      total100 += Math.floor((itemTotal % 1000) / 100);
    }
  });
  
  return { pay1000: total1000, pay100: total100 };
}

function calculatePackagingFee() {
  if (estimateList.length === 0) {
    return 0;
  }
  
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  if (!hasLargeSize) {
    return 0;
  }
  
  let maxPackagingFee = 0;
  
  estimateList.forEach(item => {
    const longerSide = Math.max(item.width, item.height);
    const shorterSide = Math.min(item.width, item.height);
    
    let fee = 0;
    
    let shortIndex = 0;
    if (shorterSide >= 1100) shortIndex = 11;
    else if (shorterSide >= 1000) shortIndex = 10;
    else if (shorterSide >= 900) shortIndex = 9;
    else if (shorterSide >= 800) shortIndex = 8;
    else if (shorterSide >= 700) shortIndex = 7;
    else if (shorterSide >= 600) shortIndex = 6;
    else if (shorterSide >= 500) shortIndex = 5;
    else if (shorterSide >= 400) shortIndex = 4;
    else if (shorterSide >= 300) shortIndex = 3;
    else if (shorterSide >= 200) shortIndex = 2;
    else if (shorterSide >= 100) shortIndex = 1;
    else shortIndex = 0;
    
    if (longerSide < 600) {
      const fees = [0, 0, 0, 0, 0, 0, 3000, 3000, 3000, 5000, 5000, 5000];
      fee = fees[shortIndex];
    } else if (longerSide < 700) {
      const fees = [0, 0, 0, 0, 0, 0, 3000, 3000, 3000, 5000, 5000, 5000];
      fee = fees[shortIndex];
    } else if (longerSide < 800) {
      const fees = [0, 0, 0, 0, 0, 0, 3000, 3000, 3000, 8000, 8000, 8000];
      fee = fees[shortIndex];
    } else if (longerSide < 900) {
      const fees = [0, 0, 0, 0, 0, 0, 3000, 3000, 3000, 8000, 8000, 10000];
      fee = fees[shortIndex];
    } else if (longerSide < 1000) {
      const fees = [0, 0, 0, 3000, 3000, 5000, 5000, 8000, 8000, 10000, 10000, 10000];
      fee = fees[shortIndex];
    } else if (longerSide < 1100) {
      const fees = [0, 0, 0, 3000, 3000, 5000, 5000, 8000, 8000, 10000, 10000, 12000];
      fee = fees[shortIndex];
    } else if (longerSide < 1200) {
      const fees = [0, 0, 0, 3000, 3000, 5000, 5000, 8000, 8000, 10000, 12000, 12000];
      fee = fees[shortIndex];
    } else if (longerSide < 1400) {
      const fees = [3000, 3000, 5000, 5000, 8000, 5000, 3000, 8000, 10000, 10000, 12000, 12000];
      fee = fees[shortIndex];
    } else if (longerSide < 1600) {
      const fees = [3000, 5000, 5000, 8000, 10000, 10000, 10000, 10000, 10000, 12000, 12000, 15000];
      fee = fees[shortIndex];
    } else if (longerSide < 1800) {
      const fees = [3000, 5000, 8000, 10000, 12000, 15000, 15000, 15000, 15000, 15000, 15000, 15000];
      fee = fees[shortIndex];
    } else if (longerSide < 2000) {
      const fees = [5000, 8000, 8000, 12000, 15000, 18000, 18000, 18000, 18000, 18000, 18000, 18000];
      fee = fees[shortIndex];
    } else if (longerSide < 2200) {
      const fees = [5000, 8000, 10000, 15000, 18000, 18000, 18000, 18000, 18000, 18000, 18000, 20000];
      fee = fees[shortIndex];
    } else if (longerSide <= 2400) {
      const fees = [8000, 10000, 12000, 15000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000];
      fee = fees[shortIndex];
    } else {
      const fees = [8000, 10000, 12000, 18000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000];
      fee = fees[shortIndex];
    }
    
    if (fee > maxPackagingFee) {
      maxPackagingFee = fee;
    }
  });
  
  return maxPackagingFee;
}

function calculateFinalTotal(productTotal, totalQuantity) {
  const packagingFee = calculatePackagingFee();
  const edgeFee = totalQuantity * 500;
  return productTotal + packagingFee + edgeFee;
}

let estimateList = [];

let orderSendMode = false;
let orderSenderName = '';

function updateAllEstimateCards() {
  const estimateListBox = document.getElementById('estimateListBox');
  if (!estimateListBox) return;
  
  estimateListBox.innerHTML = '';
  
  estimateList.forEach((estimate, index) => {
    const card = createEstimateCard(estimate, index);
    estimateListBox.appendChild(card);
  });
}

function createEstimateCard(estimate, index) {
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

  const info = document.createElement('div');
  info.style.flex = '1';
  info.style.textAlign = 'left';
  
  let priceHTML = '';
  if (estimate.discount && estimate.discount.hasDiscount) {
    priceHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
        <span style="font-size:0.85rem;color:#9ca3af;text-decoration:line-through;">${estimate.baseTotal.toLocaleString()}원</span>
        <span style="font-size:0.75rem;font-weight:700;color:#ef4444;background:#fee2e2;padding:2px 6px;border-radius:3px;">할인적용</span>
      </div>
      <div style="font-size:0.95rem;color:#4f8cff;font-weight:600;margin-top:2px;">${estimate.total.toLocaleString()}원</div>
    `;
  } else {
    priceHTML = `
      <div style="font-size:0.95rem;color:#4f8cff;margin:4px 0 0 0;">${estimate.total.toLocaleString()}원</div>
    `;
  }
  
  info.innerHTML = `
    <div style="font-size:1rem;font-weight:600;">${estimate.width} × ${estimate.height} / ${estimate.quantity}개 / ${estimate.type} ${estimate.thickness}T</div>
    ${priceHTML}
  `;
  card.appendChild(info);

  const delBtn = document.createElement('button');
  delBtn.textContent = '✕';
  delBtn.style.background = 'none';
  delBtn.style.border = 'none';
  delBtn.style.fontSize = '1.3rem';
  delBtn.style.color = '#888';
  delBtn.style.cursor = 'pointer';
  delBtn.style.marginLeft = '8px';
  
  delBtn.onclick = function() {
    estimateList.splice(index, 1);
    
    recalculateAllDiscounts();
    
    updateAllEstimateCards();
    
    const newTotal = estimateList.reduce((acc, cur) => acc + cur.total, 0);
    const newQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
    
    updateShippingNotice();
    
    if (newTotal === 0) {
      resultCard.classList.add('hide');
      return;
    }
    
    updateOrderTotalDisplay();
    
    if (paymentGuideBox) {
      updatePaymentGuide();
    }
    
    reactivateOrderSendButton();
  };
  card.appendChild(delBtn);
  
  return card;
}

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

  if (!validateSurfaceThickness(type, thickness)) {
    alert('선택하신 표면에서는 해당 두께를 사용할 수 없습니다.\n올바른 두께를 선택해주세요.');
    return;
  }

  if (checkMinimumCutting(width, height)) {
    showPopup();
    return;
  }

  const estimate = calculateEstimate();
  if (estimate === null) {
    alert('입력값을 확인해 주세요.');
    return;
  }

  estimateList.push(estimate);

  recalculateAllDiscounts();
  
  updateAllEstimateCards();

  const totalSum = estimateList.reduce((acc, cur) => acc + cur.total, 0);
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  const { pay1000, pay100 } = getPaymentGuide(totalSum);

  updateShippingNotice();

  resultCard.classList.remove('hide');

  updateOrderTotalDisplay();

  if (paymentGuideBox) {
    updatePaymentGuide();
  }
  
  reactivateOrderSendButton();
});

resultCard.classList.add('hide');

const paymentMethodBtn = document.getElementById('paymentMethodBtn');
const paymentGuideBox = document.getElementById('paymentGuideBox');
const productTotalBox = document.getElementById('productTotalBox');
const productTotalAmount = document.getElementById('productTotalAmount');
const guideTabPayment = document.getElementById('guideTabPayment');
const guideTabDelivery = document.getElementById('guideTabDelivery');

function updatePaymentGuide() {
  const guideEstimateList = document.getElementById('guideEstimateList');
  const guide100Qty = document.getElementById('guide100Qty');
  const guideTotalQty = document.getElementById('guideTotalQty');
  const guideTotalPrice = document.getElementById('guideTotalPrice');
  const guideEdgeBox = document.getElementById('guideEdgeBox');
  const guideEdgeQty = document.getElementById('guideEdgeQty');
  const guideEdgePrice = document.getElementById('guideEdgePrice');
  
  if (estimateList.length === 0) {
    guideEstimateList.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">견적 항목이 없습니다.</div>';
    guide100Qty.textContent = '0';
    
    if (guideEdgeBox) guideEdgeBox.innerHTML = '';
    if (guideEdgeQty) guideEdgeQty.textContent = '0';
    if (guideEdgePrice) guideEdgePrice.textContent = '0원';
    
    if (productTotalBox) productTotalBox.classList.add('hide');
    if (productTotalAmount) productTotalAmount.textContent = '0원';
    
    guideTotalQty.textContent = '총 수량 0개';
    guideTotalPrice.textContent = '0원';
    return;
  }
  
  guideEstimateList.innerHTML = '';
  
  const totalSum = estimateList.reduce((acc, cur) => acc + cur.total, 0);
  const totalQuantity = estimateList.reduce((acc, cur) => acc + cur.quantity, 0);
  const { pay1000, pay100 } = getPaymentGuide(totalSum);
  
  const mainBoxDiv = document.createElement('div');
  mainBoxDiv.className = 'guide-estimate-main-box';
  
  const instructionText = orderSendMode 
    ? '가로X세로 (mm) 에 주문자명을 입력하세요.'
    : '가로X세로 (mm) / 상품 수량(개)를 입력해주세요.';
  
  let mainHTML = `
    <div class="guide-estimate-input-box">
      <div class="guide-estimate-input-text">${instructionText}</div>
    </div>
  `;
  
  if (orderSendMode) {
    const totalPay1000 = Math.floor(totalSum / 1000);
    const displayName = orderSenderName || '주문자명 미입력';
    
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
    estimateList.forEach((item, index) => {
      const itemPay1000 = Math.floor(item.total / 1000);
      
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
  
  const packagingFee = calculatePackagingFee();
  if (packagingFee > 0) {
    const packagingBoxDiv = document.createElement('div');
    packagingBoxDiv.className = 'guide-estimate-main-box';
    packagingBoxDiv.innerHTML = `
      <div class="edge-optional-header">추가상품 선택</div>
      <div class="guide-estimate-row">
        <div class="estimate-info-line">
          <span class="estimate-info-text">포장비</span>
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
  
  guide100Qty.textContent = pay100;
  if (guideEdgeQty) guideEdgeQty.textContent = totalQuantity;
  if (guideEdgePrice) guideEdgePrice.textContent = edgeTotalPrice.toLocaleString() + '원';
  
  const hasDiscount = estimateList.some(item => item.discount && item.discount.hasDiscount);
  const baseTotalSum = estimateList.reduce((acc, cur) => acc + (cur.baseTotal || cur.total), 0);
  
  if (productTotalAmount) {
    productTotalAmount.textContent = totalSum.toLocaleString() + '원';
  }
  
  const discountBadge = document.getElementById('discountBadge');
  const productTotalOriginal = document.getElementById('productTotalOriginal');
  const discountNotice = document.getElementById('discountNotice');
  
  if (hasDiscount) {
    if (discountBadge) discountBadge.classList.remove('hide');
    if (productTotalOriginal) {
      productTotalOriginal.textContent = baseTotalSum.toLocaleString() + '원';
      productTotalOriginal.classList.remove('hide');
    }
    if (discountNotice) discountNotice.classList.remove('hide');
  } else {
    if (discountBadge) discountBadge.classList.add('hide');
    if (productTotalOriginal) productTotalOriginal.classList.add('hide');
    if (discountNotice) discountNotice.classList.add('hide');
  }
  
  if (productTotalBox) {
    productTotalBox.classList.remove('hide');
  }
  
  const finalTotal = calculateFinalTotal(totalSum, totalQuantity);
  
  guideTotalQty.textContent = `총 수량 ${totalQuantity}개`;
  guideTotalPrice.textContent = finalTotal.toLocaleString() + '원';
  
  const hasLargeSize = estimateList.some(item => 
    item.width >= 900 || item.height >= 900 || (item.width > 650 && item.height > 650)
  );
  
  if (hasLargeSize && estimateList.length > 0) {
    guideTabPayment.classList.remove('active');
    guideTabDelivery.classList.remove('active');
    guideTabDelivery.classList.add('delivery-active');
  } else {
    guideTabDelivery.classList.remove('delivery-active');
    guideTabDelivery.classList.remove('active');
    guideTabPayment.classList.add('active');
  }
}

if (paymentMethodBtn && paymentGuideBox) {
  paymentMethodBtn.addEventListener('click', function() {
    if (paymentGuideBox.classList.contains('hide')) {
      if (estimateList.length === 0) {
        alert('먼저 견적을 계산하고 추가해주세요.');
        return;
      }
      
      updatePaymentGuide();
      
      paymentGuideBox.classList.remove('hide');
      paymentMethodBtn.textContent = '결제방법 닫기';
    } else {
      paymentGuideBox.classList.add('hide');
      paymentMethodBtn.textContent = '결제방법';
    }
  });
}

const orderSendModeCheckbox = document.getElementById('orderSendModeCheckbox');
const orderNameSection = document.getElementById('orderNameSection');
const orderNameInput = document.getElementById('orderNameInput');
const orderNameApplyBtn = document.getElementById('orderNameApplyBtn');

if (orderSendModeCheckbox) {
  orderSendModeCheckbox.addEventListener('change', function() {
    const orderSendModeBadge = document.getElementById('orderSendModeBadge');
    
    if (this.checked) {
      orderNameSection.classList.remove('hide');
      orderSendMode = true;
      
      if (orderSendModeBadge) {
        orderSendModeBadge.classList.remove('hide');
      }
      
      const orderSendBtn = document.getElementById('orderSendBtn');
      if (orderSendBtn) {
        orderSendBtn.classList.remove('hide');
      }
      
      updateOrderTotalDisplay();
    } else {
      orderNameSection.classList.add('hide');
      orderSendMode = false;
      orderSenderName = '';
      orderNameInput.value = '';
      
      if (orderSendModeBadge) {
        orderSendModeBadge.classList.add('hide');
      }
      
      const orderSendBtn = document.getElementById('orderSendBtn');
      if (orderSendBtn) {
        orderSendBtn.classList.add('hide');
      }
      
      const orderTotalDisplay = document.getElementById('orderTotalDisplay');
      if (orderTotalDisplay) {
        orderTotalDisplay.classList.add('hide');
      }
    }
    
    if (paymentGuideBox) {
      updatePaymentGuide();
    }
  });
}

function updateOrderTotalDisplay() {
}

if (orderNameApplyBtn) {
  orderNameApplyBtn.addEventListener('click', function() {
    const name = orderNameInput.value.trim();
    if (!name) {
      alert('주문자명을 입력해주세요.');
      return;
    }
    
    orderSenderName = name;
    
    showCustomPopup('위 내용으로 결제 후 주문 내역 전송을 해주세요<br><span style="font-size: 0.95rem; opacity: 0.95; margin-top: 8px; display: inline-block;">(오전송 방지)</span>', 5000);
    
    if (paymentGuideBox) {
      updatePaymentGuide();
    }
    
    reactivateOrderSendButton();
  });
}

function reactivateOrderSendButton() {
  const orderSendBtn = document.getElementById('orderSendBtn');
  if (orderSendBtn && orderSendBtn.disabled) {
    orderSendBtn.disabled = false;
    orderSendBtn.textContent = '📦 주문 내역 전송';
    orderSendBtn.style.opacity = '1';
    orderSendBtn.style.cursor = 'pointer';
    orderSendBtn.style.background = '';
  }
}

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
    
    const confirmSend = confirm('주문 내역을 전송하시겠습니까?');
    if (!confirmSend) {
      return;
    }
    
    orderSendBtn.disabled = true;
    orderSendBtn.textContent = '📤 전송 중...';
    orderSendBtn.style.opacity = '0.6';
    orderSendBtn.style.cursor = 'not-allowed';
    
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
    
    const success = await sendToDiscord(orderData);
    
    if (success) {
      orderSendBtn.disabled = true;
      orderSendBtn.textContent = '✅ 주문이 전송 되었습니다';
      orderSendBtn.style.opacity = '0.5';
      orderSendBtn.style.cursor = 'not-allowed';
      orderSendBtn.style.background = 'linear-gradient(135deg, #9ca3af, #6b7280)';
    } else {
      orderSendBtn.disabled = false;
      orderSendBtn.textContent = '📦 주문 내역 전송';
      orderSendBtn.style.opacity = '1';
      orderSendBtn.style.cursor = 'pointer';
      orderSendBtn.style.background = '';
    }
  });
}

function showCustomPopup(message, duration = 3000) {
  const existingPopup = document.querySelector('.custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  const popup = document.createElement('div');
  popup.className = 'custom-popup';
  popup.innerHTML = `
    <div class="custom-popup-content">
      <div class="custom-popup-icon">✓</div>
      <div class="custom-popup-message">${message}</div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, duration);
}

function showDeliveryWarningPopup() {
  const existingPopup = document.querySelector('.custom-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
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
  
  setTimeout(() => {
    popup.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 3000);
}

async function sendToDiscord(orderData) {
  const webhookUrl = 'https://discord.com/api/webhooks/1424757958914609215/p0mTKGPxhAMZ60vzOHTs5iJ6M4rh4UYAVRMeVIEiI9YxVdUdV6H0I3PezTp7SmNpr0Z_';
  
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
  
  let itemsText = '';
  let hasAnyDiscount = false;
  orderData.items.forEach((item, index) => {
    const num = index + 1;
    if (item.discount && item.discount.hasDiscount) {
      hasAnyDiscount = true;
      itemsText += `${num}️⃣ ${item.width}×${item.height} / ${item.quantity}개 / ${item.type} ${item.thickness}T\n`;
      itemsText += `   💰 ~~${item.baseTotal.toLocaleString()}원~~ → **${item.total.toLocaleString()}원** (${item.discount.rate}% 할인)\n`;
    } else {
      itemsText += `${num}️⃣ ${item.width}×${item.height} / ${item.quantity}개 / ${item.type} ${item.thickness}T → 💰 ${item.total.toLocaleString()}원\n`;
    }
  });
  
  const packagingText = orderData.packagingFee > 0 
    ? `📦 **포장비 (착불):** ${orderData.packagingFee.toLocaleString()}원\n` 
    : '';
  
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

window.addEventListener('DOMContentLoaded', function() {
  updatePaymentGuide();
});
