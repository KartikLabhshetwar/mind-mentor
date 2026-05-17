.PHONY: dev dev-seed install mongo-start mongo-stop

dev:
	bash mind-mentor-agents/dev-local.sh

dev-seed:
	echo "y" | bash mind-mentor-agents/dev-local.sh

install:
	npm install
	cd server && npm install
	cd mind-mentor-agents && npm install

mongo-start:
	brew services start mongodb-community

mongo-stop:
	brew services stop mongodb-community
