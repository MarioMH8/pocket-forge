# Trust compiled editor extensions

Editor extensions, including custom React panels, are compiled dependencies selected by the Game Project author and run without a sandbox. The editor API is explicitly versioned and extensions declare compatible peer-dependency ranges, so incompatible extensions fail clearly rather than loading against an unknown host contract. Pocket Forge does not load remote extensions at runtime; authors are responsible for trusting every installed extension.
