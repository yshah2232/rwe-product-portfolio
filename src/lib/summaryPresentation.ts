/** Model task-list syntax is prose, not a new consent control. */
export function summaryProse(text: string) {
  return text.replace(/^(\s*[-*+]\s+)\[[ xX]\]\s*/gm, '$1');
}