class Cache {
  static #inactivePositionKey(positionId) {
    return `inactive-position-${positionId}`;
  }
  static #positionIdsKey() {
    return `position-ids`;
  }
  static #tokenInfoKey(address) {
    return `token-info-${address}`;
  }

  static getInactivePosition(positionId) {
    const item = localStorage.getItem(Cache.#inactivePositionKey(positionId));
    return !!item;
  }

  static saveInactivePosition(positionId) {
    localStorage.setItem(Cache.#inactivePositionKey(positionId), '1');
  }

  static getPositionIds() {
    const item = localStorage.getItem(Cache.#positionIdsKey());
    return item ? item.split(',') : [];
  }

  static savePositionIds(ids) {
    localStorage.setItem(Cache.#tokenInfoKey(), ids.join(','));
  }

  static getTokenInfo(address) {
    const item = localStorage.getItem(Cache.#tokenInfoKey(address));
    return item ? JSON.parse(item) : null;
  }

  static saveTokenInfo(tokenInfo) {
    localStorage.setItem(Cache.#tokenInfoKey(tokenInfo.address), JSON.stringify(tokenInfo));
  }
}

export default Cache;
