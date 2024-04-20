/*
  This file is part of MicroRender, a basic rendering framework.
  Copyright (C) 2023-2024 Benjamin Wilkins

  MicroRender is free software: you can redistribute it and/or modify it under the terms of the
  GNU Lesser General Public License as published by the Free Software Foundation, either version 3
  of the License, or (at your option) any later version.

  MicroRender is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
  even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License along with MicroRender.
  If not, see <https://www.gnu.org/licenses/>.
*/

export async function getJS(fragment) {
  // Load the fragment's JS if it has not been loaded already and return it.

  if (!_microrender.fragmentCache.has(fragment)) {
    _microrender.fragmentCache.set(fragment, await _microrender.fragments.get(fragment)());
  };

  return _microrender.fragmentCache.get(fragment);
};

export async function preLoadJS() {
  // Add all fragments currently in the DOM to the cache

  // Get fragments from the DOM
  const currentFragmentElements = document.querySelectorAll("microrender-fragment");
  const currentFragments = new Set(["root"]);

  for (const fragment of currentFragmentElements) {
    currentFragments.add(fragment.getAttribute("name"));
  };

  // Update the cache
  for (const fragment of _microrender.fragments.keys()) {
    if (currentFragments.has(fragment) && !_microrender.fragmentCache.has(fragment)) {
      // Add to cache
      _microrender.fragments.get(fragment)().then(fragmentJS => _microrender.fragmentCache.set(fragment, fragmentJS));
    } else if (!currentFragments.has(fragment) && _microrender.fragmentCache.has(fragment)) {
      // Remove from cache
      _microrender.fragmentCache.delete(fragment);
    };
  };
};