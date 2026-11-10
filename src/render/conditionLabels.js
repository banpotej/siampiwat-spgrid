// @ts-check

/** @typedef {import('../types.js').ConditionOperator} ConditionOperator */

/** @type {Record<ConditionOperator, string>} */
export const OPERATORS_EN = {
  contains: 'contains',
  notContains: 'does not contain',
  equals: 'is',
  notEquals: 'is not',
  startsWith: 'starts with',
  gt: 'greater than',
  gte: 'at least',
  lt: 'less than',
  lte: 'at most',
  between: 'between',
  before: 'before',
  after: 'after',
  in: 'is one of',
  notIn: 'is not one of',
  isTrue: 'is yes',
  isFalse: 'is no',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
};

/** @type {Record<ConditionOperator, string>} */
export const OPERATORS_TH = {
  contains: 'มีคำว่า',
  notContains: 'ไม่มีคำว่า',
  equals: 'เท่ากับ',
  notEquals: 'ไม่เท่ากับ',
  startsWith: 'ขึ้นต้นด้วย',
  gt: 'มากกว่า',
  gte: 'ตั้งแต่',
  lt: 'น้อยกว่า',
  lte: 'ไม่เกิน',
  between: 'ระหว่าง',
  before: 'ก่อน',
  after: 'หลัง',
  in: 'เป็นหนึ่งใน',
  notIn: 'ไม่เป็นหนึ่งใน',
  isTrue: 'ใช่',
  isFalse: 'ไม่ใช่',
  isEmpty: 'ว่าง',
  isNotEmpty: 'ไม่ว่าง',
};
