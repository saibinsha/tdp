export const parseAutoAnswer = (value: any): boolean => {
  const v = String(value ?? '').trim().toLowerCase();
  return value === true || value === 1 || v === '1' || v === 'true' || v === 'yes';
};
